#!/usr/bin/bash -e

__HEADER_FOOTER_BORDER='******************************************************************'
__HEADER_FOOTER_PREFIX='**'

function __loadEnv() {
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

function __verifyRequiredInputParams() {
    __loadEnv
    for REQ_INPUT_PARAM in {{ ' '.join(gig_mod.spec.requiredInputParams) }}
    do
        if [[ -z ${!REQ_INPUT_PARAM} ]]
        then
            echo "ERROR: Missing required input parameter ${REQ_INPUT_PARAM}" | __filterStageLogOutput '--'
            exit 1
        fi
    done
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
        echo "${INPUT_PARAMS}" | sed "s/^/${__HEADER_FOOTER_PREFIX} /g"
        echo "${__HEADER_FOOTER_BORDER}"

        kubectl patch secret -n {{ gig_run.namespace }} {{ gig_run.name }} --patch 'data:' 2>&1 > /dev/null
    fi
}

function __waitForUserInput() {
    export USER_INPUT_PATCH=${1}
    python ${GIG_RUN_HOME}/jinja_stage.py ${GIG_RUN_HOME}/user_input_patch.j2 user_input_patch.yaml

    kubectl patch gigrun ${GIG_RUN_NAME} -n ${GIG_RUN_NAMESPACE} --patch-file user_input_patch.yaml --type='merge' 2>&1 > /dev/null

    echo 'Waiting for user input...'

    kubectl wait gigrun/{{ gig_run.name }} --timeout=600s --for=jsonpath='{.spec.runState}'='Running' -n {{ gig_run.namespace }} &> /dev/null

    __saveInputParamsToEnv

    echo 'User input received; continuing...'
}

function __checkMaxThreads() {
    local MAX_THREADS=${1}
    while [[ $(jobs -r | wc -l) -ge ${MAX_THREADS} ]]
    do
        sleep 0.1
    done
}

function __checkForAbortSignal() {
    PID=${1}
    kubectl wait gigrun/{{ gig_run.name }} -n {{ gig_run.namespace }} \
        --timeout={{ GIG_TIMEOUT }}s --for=jsonpath='{.spec.runState}=Aborting' \
        2>&1 > /dev/null

    echo
    echo "=> ABORT RUN REQUESTED..."
    __killGigRun
}

function __killGigRun() {
    PID=$(cat .__ROOT_PID)
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
    local _STAGE_COUNTER=$(echo "${1}" | sed 's/\b[0-9]\b/0&/g')

    LOGGING="$(cat)"
    echo "$(__filterSecrets "${LOGGING}" | sed -e "/^${_STAGE_COUNTER}/! s/^/${_STAGE_COUNTER}-gr $(__gigRunTime) /")"
}

function __filterStepLogOutput() {
    local __DELIM=$'\x1F'
    local _STEP_ID=$(echo "${1}" | sed 's/\b[0-9]\b/0&/g')

    LOGGING="$(cat)"
    echo "$(__filterSecrets "${LOGGING}" | sed "s/^/${_STEP_ID} $(__gigRunTime) /g")"
}

function __filterSecrets() {
    __loadEnv
    local SECRETS_REGEX=$(__generateSecretFilter)
    echo "$(echo "${1}" | sed -E -e "s${__DELIM}${SECRETS_REGEX}${__DELIM}*****${__DELIM}g")"
}

function __gigRunTime() {
    local GIG_RUN_TIME=$(echo $(($(date +%s) - ${GIG_RUN_START_TIME})))
    echo $(printf '%02d:%02d:%02d' $((GIG_RUN_TIME/3600)) $((GIG_RUN_TIME/60)) $((GIG_RUN_TIME%60)) )
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
    local CURRENT_PID="${3}"
    local STAGE_TYPE="${4}"

    local STAGE_HEADER=$(
        echo
        echo "${__HEADER_FOOTER_BORDER}"
        echo "${__HEADER_FOOTER_PREFIX} STAGE ${STAGE_ID}: ${STAGE_NAME}"
        echo "${__HEADER_FOOTER_PREFIX}       PROCESS ID: ${CURRENT_PID}"
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
    local CURRENT_PID=${5}
    local STAGE_TYPE=${6}

    local STEP_HEADER=$(
        echo
        echo "${__HEADER_FOOTER_BORDER}"
        echo "${__HEADER_FOOTER_PREFIX} Step ${STEP_ID}: ${STAGE_NAME}:${STEP_NAME}"
        echo "${__HEADER_FOOTER_PREFIX}       Interpreter: ${STEP_INTERPRETER}"
        echo "${__HEADER_FOOTER_PREFIX}       PROCESS ID: ${CURRENT_PID}"
        echo "${__HEADER_FOOTER_PREFIX}       $(date)"

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
    node -e "env = {...process.env}; result = Boolean(${1}); console.log(result)"
}