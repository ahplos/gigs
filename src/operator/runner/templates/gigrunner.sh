#!/usr/bin/bash -e

touch .env gig.log

set -o allexport

function __loadStageEnv() {
    set -o allexport
    source .env
    set +o allexport
}

function convertJsonDictToEnv() {
    JSON="${1}"
    KEY_PREFIX=${2}
    BASE64=${3:+|@base64d}

    echo $(echo "${1}" | jq -r 'to_entries[]|"'${KEY_PREFIX}'\(.key)=\"\(.value'${BASE64}')\""' | tr '"' "'")
}

function __saveInputParamsToEnv() {
    INPUT_PARAMS=$(kubectl get secret -n {{ gig_run.namespace }} {{ K8S_SECRET_NAME }} -o jsonpath='{.data}')
    if [[ ! -z ${INPUT_PARAMS} ]]
    then
        INPUT_PARAMS=$(convertJsonDictToEnv ${INPUT_PARAMS} '' TRUE)
        echo "${INPUT_PARAMS}" > .env
        echo '======================='
        echo 'INPUT PARAMS RECEIVED:'
        echo
        echo "${INPUT_PARAMS}" | awk '{ print "    " $0 }'
        echo '======================='
        echo
    fi
}

function __generateSecretFilter() {
    local SECRET_VARS=$(cat ${GIG_RUNNER_HOME}/.secrets)
    local SECRETS_REGEX=''
    for VAR in ${SECRET_VARS}
    do
        SECRETS_REGEX+=${SECRETS_REGEX:+${!VAR:+|}}${!VAR}
    done

    SECRET_VARS=$(ls .secrets)
    for VAR in ${SECRET_VARS}
    do
        VAL="$(cat .secrets/${VAR})"
        SECRETS_REGEX+=${VAL:+${VAL:+|}}${VAL}
    done

    echo ${SECRETS_REGEX}
}

function __filterLogOutput() {
    local __DELIM=$'\x1F'
    while read -r LOGS
    do
        __loadStageEnv

        SECRETS_REGEX=$(__generateSecretFilter)
        echo "${LOGS}" | sed -E -e "s${__DELIM}${SECRETS_REGEX}${__DELIM}*****${__DELIM}g"
    done
}

function __end_stage() {
    STAGE_NAME="${1}"
    STAGE_TYPE="${2}"

    if [[ "${STAGE_TYPE}" == 'Input' ]]
    then
        __waitForUserInput ${STAGE_NAME}
    fi

    echo
    echo "==> STAGE COMPLETE: ${STAGE_NAME}"
    echo
}

function __waitForUserInput() {
    python ${GIG_RUNNER_HOME}/jinja_stage.py ${1}

    kubectl patch gigrun ${GIG_RUN_NAME} -n ${POD_NAMESPACE} --patch-file user_input_patch.yaml --type='merge'

    kubectl wait gigrun/{{ gig_run.name }} \
        --timeout=600s --for=jsonpath='{.status.state}'='WaitingForInput' -n {{ gig_run.namespace }} &> /dev/null

    echo
    echo 'Waiting for user input...'

    kubectl wait gigrun/{{ gig_run.name }} --timeout=600s --for=jsonpath='{.status.state}'='Running' -n {{ gig_run.namespace }} &> /dev/null

    __saveInputParamsToEnv

    echo
    echo 'User input received; continuing...'
}

set +o allexport

${GIG_RUNNER_HOME}/stagerunner.sh &
tail -q --pid $! -f gig.log -n +1
exit $([ -f .stagerunner_exit_status ] && cat .stagerunner_exit_status)

