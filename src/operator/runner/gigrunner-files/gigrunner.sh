#!/usr/bin/bash -e

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
        echo
        echo '======================='
        echo 'INPUT PARAMS RECEIVED:'
        echo
        echo "${INPUT_PARAMS}" | awk '{ print "    " $0 }'
        echo '======================='
        echo

        kubectl patch secret -n {{ gig_run.namespace }} {{ gig_run.name }} --patch 'data:' 2>&1 > /dev/null
    fi

}

function __generateSecretFilter() {
    local SECRET_VARS=$(cat .secrets)
    local SECRETS_REGEX=''
    for VAR in ${SECRET_VARS}
    do
        SECRETS_REGEX+=${SECRETS_REGEX:+${!VAR:+|}}${!VAR}
    done

    echo ${SECRETS_REGEX}
}

function __filterLogOutput() {
    local __DELIM=$'\x1F'
    while read -r LOGS
    do
        __loadStageEnv
        local GIG_RUN_TIME=$(echo $(($(date +%s) - ${GIG_RUN_START_TIME})) | sed 's/00://g')
        [[ ${LOGS} =~ ^[^\[] ]] && ! [[ ${LOGS} =~ ^\*\* ]] && \
            echo -n "${LOGS:+${1:+[$(date -d@${GIG_RUN_TIME} -u +%Hh:%Mm:%Ss)|STG ${1}]}} "
        SECRETS_REGEX=$(__generateSecretFilter)
        if [[ -z ${SECRETS_REGEX} ]]
        then
            echo "${LOGS}"
        else
            echo "${LOGS}" | sed -E -e "s${__DELIM}${SECRETS_REGEX}${__DELIM}*****${__DELIM}g"
        fi
    done
}

function __stageHeader() {
    local STAGE_ID=${1}
    local STAGE_NAME=${2}
    local STAGE_SCRIPT_TYPE=${3}
    local STAGE_DESC="${4}"
    local STAGE_TYPE="${5}"

    export local BORDER='******************************************************************'
    export local PREFIX='**'

    local STAGE_HEADER=$(
        echo
        echo "${BORDER}"
        echo "${PREFIX}"
        echo "${PREFIX} Stage ${STAGE_ID}: ${STAGE_NAME}"
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

function __waitForUserInput() {
    python ${GIG_RUNNER_HOME}/jinja_stage.py ${1}

    kubectl patch gigrun ${GIG_RUN_NAME} -n ${POD_NAMESPACE} --patch-file user_input_patch.yaml --type='merge' 2>&1 > /dev/null

    echo 'Waiting for user input...'

    kubectl wait gigrun/{{ gig_run.name }} --timeout=600s --for=jsonpath='{.spec.runState}'='Running' -n {{ gig_run.namespace }} &> /dev/null

    __saveInputParamsToEnv

    echo 'User input received; continuing...'
}

function __checkForAbortSignal() {
    PID=${1}
    kubectl wait gigrun/{{ gig_run.name }} -n {{ gig_run.namespace }} \
        --timeout={{ GIG_TIMEOUT }}s --for=jsonpath='{.spec.runState}'='Aborting'

    echo "ABORT RUN..." > gig.log
    set -x
    timeout 30s pkill -P ${PID} || pkill --signal KILL ${PID}
    set +x
}

function __gigRunHeader() {
    echo '======================='
    echo "GIG: {{ gig_mod.name }}"
    if [[ "{{ gig_mod.description }}" ]]
    then
        echo "{{ gig_mod.description }}"
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

function __gigRunFooter() {
    echo
    echo '******************************************************************'
    echo '** GIG COMPLETE'
    echo '**'
    echo "** $(date)"
    echo '******************************************************************'
    echo
}

GIG_RUN_START_TIME=$(date +%s)
set +o allexport

touch .secrets .env gig.log

echo "$(__gigRunHeader)" 2>&1 >> gig.log

${GIG_RUNNER_HOME}/{{ gig_mod.namespace }}-{{ gig_mod.name }}/stagerunner.sh >> gig.log &
PID=$!
__checkForAbortSignal ${PID} &
tail -q --pid ${PID} -f gig.log -n +1

__gigRunFooter | tee gig.log

exit $([ -f .stagerunner_exit_status ] && cat .stagerunner_exit_status)

