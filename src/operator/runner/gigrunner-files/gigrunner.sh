#!/usr/bin/bash -e

STAGE_RUNNER_SCRIPT=${1}

touch .env gig.log

set -o allexport

function __loadStageEnv() {
    set -o allexport
    source .env
    set +o allexport
}

function __convertJsonDictToEnv() {
    JSON="${1}"
    KEY_PREFIX=${2}
    BASE64=${3:+|@base64d}

    echo $(echo "${JSON}" | jq -r 'to_entries[]|"'${KEY_PREFIX}'\(.key)=\"\(.value'${BASE64}')\""' | tr '"' "'")
}

function __saveInputParamsToEnv() {
    INPUT_PARAMS=$(kubectl get secret -n {{ gig_run.namespace }} {{ gig_run.name }} -o jsonpath='{.data}')
    if [[ ! -z ${INPUT_PARAMS} ]]
    then
        INPUT_PARAMS=$(__convertJsonDictToEnv ${INPUT_PARAMS} '' TRUE | tr ' ' '\n')
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
        if [[ -z ${SECRETS_REGEX} ]]
        then
            echo "${LOGS}"
        else
            echo "${LOGS}" | sed -E -e "s${__DELIM}${SECRETS_REGEX}${__DELIM}*****${__DELIM}g"
        fi
    done
}

function __stage_header() {
    local STAGE_COUNTER=${1}
    local STAGE_NAME=${2}
    local STAGE_SCRIPT_TYPE=${3}
    local STAGE_DESC="${4}"
    local STAGE_TYPE="${5}"

    export local BORDER='******************************************************************'
    export local PREFIX='**'

    local STAGE_HEADER=$(
        echo "${BORDER}"
        echo "${PREFIX}"
        echo "${PREFIX} Stage $(printf '%02d' ${STAGE_COUNTER}): ${STAGE_NAME}"
        echo "${PREFIX} Script: ${STAGE_SCRIPT_TYPE}"
        echo "${PREFIX}"

        if [[ ${STAGE_DESC} ]]
        then
            echo "${PREFIX} ${STAGE_DESC}"
            echo "${PREFIX}"
        fi

        if [[ ${STAGE_TYPE} == 'HAS_SECRETS' ]]
        then
            echo "${PREFIX} WARNING: SECRETS REALIZED [Debug logging output suppressed]"
            echo "${PREFIX}"
        elif [[ ${STAGE_TYPE} == 'SKIPPED' ]]
        then
            echo "${PREFIX} WARNING: STAGE SKIPPED [Precondition(s) for execution failed]"
            echo "${PREFIX}"
        fi

        echo "${BORDER}"
    )

    echo "${STAGE_HEADER}"
}

function __stage_header() {
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

    echo
    echo 'Waiting for user input...'

    kubectl wait gigrun/{{ gig_run.name }} --timeout=600s --for=jsonpath='{.spec.runState}'='Running' -n {{ gig_run.namespace }} &> /dev/null

    __saveInputParamsToEnv

    echo
    echo 'User input received; continuing...'
}

set +o allexport

function __checkForAbortSignal() {
    PID=${1}
    kubectl wait gigrun/{{ gig_run.name }} -n {{ gig_run.namespace }} \
        --timeout={{ GIG_TIMEOUT }}s --for=jsonpath='{.spec.runState}'='Aborting'

    echo "ABORT RUN..." > gig.log
    set -x
    timeout 30s pkill -P ${PID} || pkill --signal KILL ${PID}
    set +x
}

function __gig_run_header() {
    echo '======================='
    echo "GIG: {{ gig_def.name }}"
    if [[ "{{ gig_def.description }}" ]]
    then
        echo "{{ gig_def.description }}"
    fi
    echo
    date
    echo '======================='
    echo

    echo '======================='
    KUBE_EXEC=kubectl
    type oc >/dev/null 2>&1
    if [[ $? ]]
    then
        KUBE_EXEC=oc
    fi
    echo "${KUBE_EXEC} version"
    echo
    ${KUBE_EXEC} version
    echo '======================='
    echo
}

function __gig_run_footer() {
    echo
    echo '******************************************************************'
    echo '** GIG COMPLETE'
    echo '******************************************************************'
    echo
}

touch .env

__gig_run_header

${GIG_RUNNER_HOME}/{{ gig_def.namespace }}-{{ gig_def.name }}/stagerunner.sh &
PID=$!
__checkForAbortSignal ${PID} &
tail -q --pid ${PID} -f gig.log -n +1

__gig_run_footer

exit $([ -f .stagerunner_exit_status ] && cat .stagerunner_exit_status)

