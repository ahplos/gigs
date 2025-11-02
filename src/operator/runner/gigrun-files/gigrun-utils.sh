#!/usr/bin/bash -e

__HEADER_FOOTER_BORDER='******************************************************************'
__HEADER_FOOTER_PREFIX='**'

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
        echo "${__HEADER_FOOTER_BORDER}"
        echo "${__HEADER_FOOTER_PREFIX} INPUT PARAMS RECEIVED:"
        echo "${__HEADER_FOOTER_PREFIX}"
        echo "${INPUT_PARAMS}" | awk -v PREFIX="${__HEADER_FOOTER_PREFIX}" '{ print PREFIX "    " $0 }'
        echo "${__HEADER_FOOTER_BORDER}"

        kubectl patch secret -n {{ gig_run.namespace }} {{ gig_run.name }} --patch 'data:' 2>&1 > /dev/null
    fi
}

function __waitForUserInput() {
    export USER_INPUT_PATCH=${1}
    python ${GIG_RUN_HOME}/jinja_stage.py ${GIG_RUN_HOME}/user_input_patch.j2 user_input_patch.yaml

    kubectl patch gigrun ${GIG_RUN_NAME} -n ${POD_NAMESPACE} --patch-file user_input_patch.yaml --type='merge' 2>&1 > /dev/null

    echo 'Waiting for user input...'

    kubectl wait gigrun/{{ gig_run.name }} --timeout=600s --for=jsonpath='{.spec.runState}'='Running' -n {{ gig_run.namespace }} &> /dev/null

    __saveInputParamsToEnv

    echo 'User input received; continuing...'
}

function __checkForAbortSignal() {
    PID=${1}
    kubectl wait gigrun/{{ gig_run.name }} -n {{ gig_run.namespace }} \
        --timeout={{ GIG_TIMEOUT }}s --for=jsonpath='{.spec.runState}=Aborting' \
        2>&1 > /dev/null

    echo
    echo "=> ABORT RUN REQUESTED..."
    timeout 30s pkill -P ${PID} || pkill --signal KILL -P ${PID}
}

function __generateSecretFilter() {
    local SECRET_VARS=$(cat .secrets)
    local SECRETS_REGEX=''
    for VAR in ${SECRET_VARS}
    do
        SECRETS_REGEX+=${SECRETS_REGEX:+${!VAR:+|}}${!VAR}
    done

    echo ${SECRETS_REGEX:-$(echo -e '\u2654')}
}

function __filterStageLogOutput() {
    local __DELIM=$'\x1F'
    local _STAGE_COUNTER=$(printf "%2s" ${1} | tr ' ' 0})
    while read -r LOGS
    do
        local NEW_LOGS=${_STAGE_COUNTER}
        if [[ ${LOGS} =~ ^- ]]
        then
            NEW_LOGS="${NEW_LOGS}${LOGS}"
        else
            NEW_LOGS="${NEW_LOGS}-Gg|$(__gigRunTime)  ${LOGS}"
        fi

        __loadStageEnv
        local SECRETS_REGEX=$(__generateSecretFilter)
        echo "${NEW_LOGS}" | sed -E -e "s${__DELIM}${SECRETS_REGEX}${__DELIM}*****${__DELIM}g"
    done
}

function __filterStepLogOutput() {
    local _STEP_COUNTER=$(printf "%2s" ${1} | tr ' ' 0})
    while read -r LOGS
    do
        echo "-${_STEP_COUNTER}|$(__gigRunTime)  ${LOGS}"
    done
}

function __gigRunTime() {
    local GIG_RUN_TIME=$(echo $(($(date +%s) - ${GIG_RUN_START_TIME})))
    local GIG_RUN_TIME_HRS=$(printf '%02d' $((GIG_RUN_TIME/3600)))
    local GIG_RUN_TIME_MIN=$(printf '%02d' $((GIG_RUN_TIME/60)))
    local GIG_RUN_TIME_SEC=$(printf '%02d' $((GIG_RUN_TIME%60)))
    echo "${GIG_RUN_TIME_HRS}:${GIG_RUN_TIME_MIN}:${GIG_RUN_TIME_SEC}"
}

function __gigRunHeader() {
    echo "${__HEADER_FOOTER_BORDER}"
    echo "${__HEADER_FOOTER_PREFIX} GIG: {{ gig_mod.name }}"
    {%- if gig_mod.spec.description %}
    echo "${__HEADER_FOOTER_PREFIX} {{ gig_mod.spec.description }}"
    {%- endif %}
    echo "${__HEADER_FOOTER_PREFIX} $(date)"
    echo "${__HEADER_FOOTER_PREFIX}"
    KUBE_EXEC=kubectl
    type oc >/dev/null 2>&1
    if [[ $? ]]
    then
        KUBE_EXEC=oc
    fi
    echo "${__HEADER_FOOTER_PREFIX} ${KUBE_EXEC} version"
    ${KUBE_EXEC} version | sed "s/^\(.*\)/${__HEADER_FOOTER_PREFIX} \1/g"
    echo "${__HEADER_FOOTER_BORDER}"

    __saveInputParamsToEnv
}

function __gigRunFooter() {
    echo
    echo "${__HEADER_FOOTER_BORDER}"
    echo "${__HEADER_FOOTER_PREFIX} GIG COMPLETE: EXIT CODE ${1}"
    echo "${__HEADER_FOOTER_PREFIX}"
    echo "** $(date)"
    echo "${__HEADER_FOOTER_BORDER}"
}

function __stageHeader() {
    local STAGE_ID=${1}
    local STAGE_NAME=${2}
    local STAGE_TYPE="${3}"

    local STAGE_HEADER=$(
        echo
        echo "${__HEADER_FOOTER_BORDER}"
        echo "${__HEADER_FOOTER_PREFIX} STAGE ${STAGE_ID}: ${STAGE_NAME}"
        echo "${__HEADER_FOOTER_PREFIX}       $(date)"

        if [[ ${STAGE_TYPE} == 'SKIPPED' ]]
        then
            echo "${__HEADER_FOOTER_PREFIX}"
            echo "${__HEADER_FOOTER_PREFIX} WARNING: STAGE SKIPPED [Precondition(s) for execution failed]"
        fi

        echo "${__HEADER_FOOTER_BORDER}"
    )

    echo "${STAGE_HEADER}"
}

function __stepHeader() {
    local STEP_ID=${1}
    local STAGE_NAME=${2}
    local STEP_NAME=${3}
    local STEP_INTERPRETER=${4}
    local STAGE_TYPE=${5}

    local STEP_HEADER=$(
        echo
        echo "${__HEADER_FOOTER_BORDER}"
        echo "${__HEADER_FOOTER_PREFIX} Step ${STEP_ID}: ${STAGE_NAME}:${STEP_NAME}"
        echo "${__HEADER_FOOTER_PREFIX} Interpreter: ${STEP_INTERPRETER}"

        if [[ ${STAGE_TYPE} == 'HAS_SECRETS' ]]
        then
            echo "${__HEADER_FOOTER_PREFIX} WARNING: SECRETS REALIZED [Logging output suppressed]"
        elif [[ ${STAGE_TYPE} == 'SKIPPED' ]]
        then
            echo "${__HEADER_FOOTER_PREFIX} WARNING: STEP SKIPPED [Precondition(s) for execution failed]"
        fi

        echo "${__HEADER_FOOTER_BORDER}"
    )

    echo "${STEP_HEADER}"
}

function __testWhen() {
    local GIG_MOD_DIR_NAME=${1}
    local STAGE_OR_STEP_TEST_JS="when_${2}.js"

    if [[ -f ${GIG_RUN_HOME}/${GIG_MOD_DIR_NAME}/${STAGE_OR_STEP_TEST_JS} ]]
    then
        node ${GIG_RUN_HOME}/${GIG_MOD_DIR_NAME}/${STAGE_OR_STEP_TEST_JS}
    fi
}