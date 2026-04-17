#!/usr/bin/bash

ECHO_XTRACE_REGEX='^[+]+\s+echo(\s|$)'

__HEADER_FOOTER_BORDER='******************************************************************'
__HEADER_FOOTER_PREFIX='**'

function __verifyRequiredInputParams() {
    for REQ_INPUT_PARAM in {{ ' '.join(gig_mod.spec.requiredInputParams) }}
    do
        if [[ -z $(gigEnvGet ${REQ_INPUT_PARAM}) ]]
        then
            echo "ERROR: Missing required input parameter ${REQ_INPUT_PARAM}" | __logOutput '--'
            exit 1
        fi
    done
}

function __saveInputParamsToEnv() {
    local JSON_INPUT_VALUES=$(kubectl get secret --ignore-not-found -n {{ gig_run.namespace }} {{ gig_run.name }} -o jsonpath='{.data.inputValues}' | base64 --decode)
    local GIG_RUN_INPUT=$(jq -s '.[0] + .[1] // empty' <(echo ${GIG_RUN_INPUT}) <(echo ${JSON_INPUT_VALUES}))
    gigEnvSet __GIG_RUN_INPUT "${GIG_RUN_INPUT}"

    echo
    echo "${__HEADER_FOOTER_BORDER}"
    if [[ ! -z ${GIG_RUN_INPUT} ]]
    then
        INPUT_PARAMS=$(echo "${GIG_RUN_INPUT}" | jq -r 'to_entries[]|"\(.key)=\(.value)"')
        for INPUT_PARAM in ${INPUT_PARAMS}
        do
            gigEnvSet $(echo ${INPUT_PARAM} | tr '=' ' ')
        done

        echo "${__HEADER_FOOTER_PREFIX} INPUT PARAMS RECEIVED:"
        echo "${__HEADER_FOOTER_PREFIX}"
        echo "${INPUT_PARAMS}" | sed "s/^/${__HEADER_FOOTER_PREFIX} /g"

        kubectl patch secret -n {{ gig_run.namespace }} {{ gig_run.name }} --patch 'data:' 2>&1 > /dev/null
    else
        echo "${__HEADER_FOOTER_PREFIX} NO INPUT PARAMS RECEIVED"
    fi

    echo "${__HEADER_FOOTER_BORDER}"
}

function __waitForUserInput() {
    export USER_INPUT_PATCH=${1}
    python ${GIG_RUN_HOME}/jinja_stage.py ${GIG_RUN_HOME}/user_input_patch.j2 user_input_patch.yaml

    kubectl patch gigrun ${GIG_RUN_NAME} -n ${GIG_RUN_NAMESPACE} --patch-file user_input_patch.yaml --type='merge' --warnings-as-errors 2>&1 > /dev/null
    if [[ $? == 0 ]]
    then
        echo 'Waiting for user input...'

        kubectl wait gigrun/{{ gig_run.name }} --timeout=600s --for=jsonpath='{.spec.runState}'='Running' -n {{ gig_run.namespace }} 2>&1 > /dev/null

        __saveInputParamsToEnv

        echo
        echo 'User input received; continuing...'
    else
        return 1
    fi
}

function __checkMaxThreads() {
    local MAX_THREADS=${1}
    while [[ $(jobs -r | wc -l) -ge ${MAX_THREADS} ]]
    do
        sleep 0.1
    done
}

function __checkForAbortSignal() {
    kubectl wait gigrun/{{ gig_run.name }} -n {{ gig_run.namespace }} \
        --timeout={{ GIG_TIMEOUT }}s --for=jsonpath='{.spec.runState}=Aborting' \
        2>&1 > /dev/null

    echo
    echo "=> ABORT RUN REQUESTED..."
    __killGigRun
}

function __killGigRun() {
    local PID=$(gigEnvGet GIG_PID)
    timeout 30s pkill -P ${PID} || pkill --signal KILL -P ${PID}
}

function __generateSecretFilter() {
    local GIG_SECRET_VARS="$(gigSecrets | xargs)"
    local STAGE_SECRET_VARS="$(stageSecrets | xargs)"
    local SECRETS_REGEX=''
    for VAR in ${GIG_SECRET_VARS} ${STAGE_SECRET_VARS}
    do
        SECRETS_REGEX+=${SECRETS_REGEX:+${SECRETS_REGEX:+|}}$(gigEnvGet ${VAR})
    done

    echo ${SECRETS_REGEX:-$(echo -e '\u2654')}
}

function __logOutput() {
    local _HEADER_ID=$(echo "${1}" | sed 's/\b[0-9]\b/0&/g')

    HEADER=$(awk -v H_ID="${_HEADER_ID}" -v RUN_TIME="$(__gigRunTime)" \
        '{sub(/^/, sprintf("%-25s", "["RUN_TIME"|"H_ID"] ")); print}')

    echo "${HEADER} $(cat)"
}

function __logFilteredOutput() {
    local INPUT="$(cat)"
    INPUT=$(echo "${INPUT}" | sed -E "/${ECHO_XTRACE_REGEX}/d")
    if [[ ! -z "${INPUT}" ]]
    then
        __filterSecrets "${INPUT}" | __logOutput "${1}"
    fi
}

function __filterSecrets() {
    local __DELIM=$'\x1F'
    local SECRETS_REGEX=$(__generateSecretFilter)

    echo "${1}" | sed -E -e "s${__DELIM}${SECRETS_REGEX}${__DELIM}*****${__DELIM}g"
}

function __gigRunTime() {
    local GIG_RUN_TIME=$(gigdb-cli INFO | grep uptime_in_seconds | sed 's/[^0-9]//g')
    local HOURS=$((GIG_RUN_TIME/3600))
    local MINUTES=$((GIG_RUN_TIME%3600/60))
    local SECONDS=$((GIG_RUN_TIME%60))
    echo $(printf '%02d:%02d:%02d' ${HOURS} ${MINUTES} ${SECONDS})
}

function __gigRunHeader() {
    echo "${__HEADER_FOOTER_BORDER}"
    echo "${__HEADER_FOOTER_PREFIX} GIG: {{ gig_mod.name }}"
    {%- if gig_mod.spec.description %}
    echo "${__HEADER_FOOTER_PREFIX} {{ gig_mod.spec.description }}"
    {%- endif %}
    echo "${__HEADER_FOOTER_PREFIX} $(date)"
    echo "${__HEADER_FOOTER_PREFIX}"

    [[ -z $(type -p oc) ]] && KUBE_EXEC=kubectl || KUBE_EXEC=oc
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

    echo "${STAGE_HEADER}" | __logOutput "${STAGE_ID}"
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

    echo "${STEP_HEADER}"  | __logOutput "${STEP_ID}"
}

function __testWhen() {
    local GIG_RUN_INPUT=$(gigEnvGet __GIG_RUN_INPUT | tr -d '\n')
    node -e "jsonstr = '${GIG_RUN_INPUT}'; env = {...process.env}; const input = JSON.parse(jsonstr); console.log(${1})"
}