#!/usr/bin/bash

trap 'gigEnvSet __ERR_LINENO ${LINENO}; gigEnvSet __ERR_FILE_NAME $(basename ${BASH_SOURCE})' ERR

ECHO_XTRACE_REGEX='^[+]+\s+echo(\s|$)'

__HEADER_FOOTER_BORDER='******************************************************************'
__HEADER_FOOTER_PREFIX='**'

__DELIM=$'\x1F'

function __initNode() {
    ALL_NPM_PACKAGES=$(ls $(npm root -g))
    for FOLDER in ${GIGRUN_HOME} $(ls -d ${GIGRUN_HOME}/*/)
    do
        (
            cd ${FOLDER}
            echo ${ALL_NPM_PACKAGES} | xargs -I {} npm link {} >/dev/null
        )
    done
}

function __saveInputParamsToEnv() {
    local MODULE_INPUT_PARAMS=({{ gig_mod.spec.inputParams | map(attribute='name') | join(' ') }})
    local JSON_INPUT_VALUES=$(kubectl get secret --ignore-not-found -n {{ gig_run.namespace }} {{ gig_run.name }} -o jsonpath='{.data.inputValues}' | base64 --decode)
    local GIGRUN_INPUT=$(jq -s '.[0] + .[1] // empty' <(echo ${GIGRUN_INPUT}) <(echo ${JSON_INPUT_VALUES}))

    echo
    echo "${__HEADER_FOOTER_BORDER}"
    if [[ -n ${GIGRUN_INPUT} ]]
    then
        echo "${__HEADER_FOOTER_PREFIX} INPUT PARAMS RECEIVED:"
        for INPUT_PARAM in $(echo "${GIGRUN_INPUT}" | jq -r 'keys | join(" ")')
        do
            if [[ -n ${STEP_COUNTER} || " ${MODULE_INPUT_PARAMS[@]} " =~ " ${INPUT_PARAM} " ]]
            then
                local INPUT_VALUE=$(echo "${GIGRUN_INPUT}" | jq -r ".${INPUT_PARAM}")
                gigEnvSet ${INPUT_PARAM} "${INPUT_VALUE}"
                echo "${__HEADER_FOOTER_PREFIX}    ${INPUT_PARAM}: $(gigEnvGet ${INPUT_PARAM} | xargs)"
            else
                echo "${__HEADER_FOOTER_PREFIX}    ${INPUT_PARAM}[IGNORED]: not declared in module"
            fi
        done

        kubectl patch secret -n {{ gig_run.namespace }} {{ gig_run.name }} --patch 'data:' 2>&1 >/dev/null
    else
        echo "${__HEADER_FOOTER_PREFIX} NO INPUT PARAMS RECEIVED"
    fi

    echo "${__HEADER_FOOTER_BORDER}"
}

function __verifyInputParams() {
    local MODULE_INPUT_PARAMS=({{ gig_mod.spec.inputParams | map(attribute='name') | join(' ') | lower }})
    local REQUIRED=({{ gig_mod.spec.inputParams | map(attribute='required', default='false') | join(' ') }})

    for INDEX in ${!MODULE_INPUT_PARAMS[@]}
    do
        if [[ -z $(gigEnvGet ${MODULE_INPUT_PARAMS[${INDEX}]}) && ${REQUIRED[${INDEX}]} == 'true' ]]
        then
            echo "ERROR: Missing required input parameter ${REQ_INPUT_PARAM}" |& __logOutput '--'
            exit 1
        fi
    done
}

function __waitForUserInput() {
    local USER_INPUT_PATCH=${1}

    kubectl patch gigrun ${GIGRUN_NAME} -n ${GIGRUN_NAMESPACE} --patch-file ${USER_INPUT_PATCH} --type='merge' --warnings-as-errors >/dev/null
    if [[ $? == 0 ]]
    then
        echo 'Waiting for user input...'

        kubectl wait gigrun/{{ gig_run.name }} --timeout=600s --for=jsonpath='{.spec.runState}'='Running' -n {{ gig_run.namespace }} >/dev/null
        __saveInputParamsToEnv

        echo
        echo 'User input received; continuing...'
    else
        return 1
    fi
}

function __checkMaxThreads() {
    (
        { set +x; } 2>/dev/null
        local MAX_THREADS="${1}"
        if [[ -n ${MAX_THREADS} && ${MAX_THREADS} =~ ^[0-9]+$ && ${MAX_THREADS} > 0 ]]
        then
            while [[ $(jobs -r | wc -l) -ge ${MAX_THREADS} ]]
            do
                sleep 0.1
            done
        fi
    )
}

function __checkForAbortSignal() {
    kubectl wait gigrun/{{ gig_run.name }} -n {{ gig_run.namespace }} \
        --timeout={{ GIG_TIMEOUT }}s --for=jsonpath='{.spec.runState}=Aborting' \
        2>&1 >/dev/null

    __killGigRun "==> ABORT RUN REQUESTED..."
}

function __killGigRun() {
    echo
    echo "${1:-==> GIG FAILURE[$(gigEnvGet __ERR_FILE_NAME):ln $(gigEnvGet __ERR_LINENO)]: TERMINATING DUE TO ERROR IN GIG}"
    sleep 5
    local PID=$(gigEnvGet GIG_PID)
    (timeout 30s pkill -P ${PID} || pkill --signal KILL -P ${PID}) >/dev/null
}

function __logOutput() {
    (
        { set +x; } 2>/dev/null
        local OUT=$(
            while IFS='' read -r LOG_OUT
            do
                local LOG_HDR=$(printf "%s%18s" "$(__gigRunTime)" "[${STEP_COUNTER:-${STAGE_COUNTER:---}}] ")
                SECRETS_REGEX=$(__generateSecretFilter)
                echo "${LOG_OUT}" |
                    sed -Ee "s${__DELIM}${SECRETS_REGEX:-$'\u2063'}${__DELIM}*****${__DELIM}g" \
                        -e "/${ECHO_XTRACE_REGEX}/d" \
                        -e "s/^/${LOG_HDR}/g"
            done
        )
        echo "${OUT}"
    )
}

function __generateSecretFilter() {
    local GIG_SECRET_VARS="$(gigSecrets | xargs)"
    local GIG_VALUES=${GIG_SECRET_VARS:+$(gigdb-cli --raw HMGET GIG_ENV ${GIG_SECRET_VARS} | xargs)}

    local STAGE_SECRET_VARS=${STAGE_ID:+"$(stageSecrets | xargs)"}
    local STAGE_VALUES=${STAGE_SECRET_VARS:+$(gigdb-cli --raw HMGET ${STAGE_ID} ${STAGE_SECRET_VARS} | xargs)}

    local STEP_SECRET_VARS=${STEP_ID:+"$(stepSecrets | xargs)"}
    local STEP_VALUES=${STEP_SECRET_VARS:+$(gigdb-cli --raw HMGET ${STEP_ID} ${STEP_SECRET_VARS} | xargs)}

    echo "${GIG_VALUES}${STAGE_VALUES:+ ${STAGE_VALUES}}${STEP_VALUES:+ ${STEP_VALUES}}" | xargs | sed -e 's/[[:space:]]/|/g'
}

function __gigRunTime() {
    (
        { set +x; } 2>/dev/null
        local GIGRUN_TIME=$(gigdb-cli INFO | grep uptime_in_seconds | sed 's/[^0-9]//g')
        local HOURS=$((GIGRUN_TIME/3600))
        local MINUTES=$((GIGRUN_TIME%3600/60))
        local SECONDS=$((GIGRUN_TIME%60))
        echo $(printf '%02d:%02d:%02d' ${HOURS} ${MINUTES} ${SECONDS})
    )
}

function __gigRunHeader() {
    export CURRENT_PID=${BASHPID}
    local GIG_HEADER=$(
        echo "${__HEADER_FOOTER_BORDER}"
        echo "${__HEADER_FOOTER_PREFIX} GIG: {{ gig_mod.name }}"
        {%- if gig_mod.spec.description %}
        echo "${__HEADER_FOOTER_PREFIX} {{ gig_mod.spec.description }}"
        {%- endif %}
        echo "${__HEADER_FOOTER_PREFIX} PROCESS ID: ${CURRENT_PID}"
        echo "${__HEADER_FOOTER_PREFIX} $(date)"
        echo "${__HEADER_FOOTER_PREFIX}"

        [[ -z $(type -p oc) ]] && KUBE_EXEC=kubectl || KUBE_EXEC=oc
        echo "${__HEADER_FOOTER_PREFIX} ${KUBE_EXEC} version"
        ${KUBE_EXEC} version | sed "s/^\(.*\)/${__HEADER_FOOTER_PREFIX} \1/g"
        echo "${__HEADER_FOOTER_PREFIX} Helm: $(helm version --short)"
        echo "${__HEADER_FOOTER_BORDER}"
    )
    unset CURRENT_PID
    echo "${GIG_HEADER}" | __logOutput '--'
}

function __gigRunFooter() {
    echo
    echo "${__HEADER_FOOTER_BORDER}"
    echo "${__HEADER_FOOTER_PREFIX} GIG COMPLETE: EXIT CODE ${1}"
    echo "${__HEADER_FOOTER_PREFIX}"
    echo "${__HEADER_FOOTER_PREFIX} $(date)"
    echo "${__HEADER_FOOTER_BORDER}"
}

function __stageHeader() {
    local STAGE_COUNTER=${1}
    local STAGE_NAME=${2}
    export CURRENT_PID=${3}
    local STAGE_TYPE=${4}

    local STAGE_HEADER=$(
        echo
        echo "${__HEADER_FOOTER_BORDER}"
        echo "${__HEADER_FOOTER_PREFIX} STAGE ${STAGE_COUNTER}: ${STAGE_NAME}"
        if [[ ${STAGE_TYPE} == 'SKIPPED' ]]
        then
            echo "${__HEADER_FOOTER_PREFIX}       SKIPPED: Precondition(s) for execution failed"
        else
            echo "${__HEADER_FOOTER_PREFIX}       PROCESS ID: ${CURRENT_PID}"
        fi
        echo "${__HEADER_FOOTER_PREFIX}       START: $(date)"
        echo "${__HEADER_FOOTER_BORDER}"
    )

    unset CURRENT_PID
    echo "${STAGE_HEADER}" | __logOutput "${STAGE_COUNTER}"
}

function __stepHeader() {
    local STEP_COUNTER=${1}
    local STAGE_NAME=${2}
    local STEP_NAME=${3}
    local STEP_RUNTIME=${4}
    local CURRENT_PID=${5}
    local STAGE_TYPE=${6}

    local STEP_HEADER=$(
        echo
        echo "${__HEADER_FOOTER_BORDER}"
        echo "${__HEADER_FOOTER_PREFIX} Step ${STEP_COUNTER}: ${STAGE_NAME}:${STEP_NAME}"
        echo "${__HEADER_FOOTER_PREFIX} STAGE ${STAGE_COUNTER}: ${STAGE_NAME}"
        if [[ ${STAGE_TYPE} == 'SKIPPED' ]]
        then
            echo "${__HEADER_FOOTER_PREFIX}       SKIPPED: Precondition(s) for execution failed"
        else
            echo "${__HEADER_FOOTER_PREFIX}       PROCESS ID: ${CURRENT_PID}"
        fi
        echo "${__HEADER_FOOTER_PREFIX}       Runtime: ${STEP_RUNTIME}"
        echo "${__HEADER_FOOTER_BORDER}"
    )

    unset CURRENT_PID
    echo "${STEP_HEADER}"  | __logOutput "${STEP_COUNTER}"
}

function __stepFooter() {
    local STEP_COUNTER=${1}
    local STAGE_NAME=${2}
    local STEP_NAME=${3}
    local TIME_SECONDS=${4}
    local RESULT=$(stepEnvGet __STEP_RESULT)

    if [[ -z ${RESULT} || ${RESULT} == 0 ]]
    then
        echo "==> SUCCESS: Step ${STEP_COUNTER} ${STAGE_NAME}:${STEP_NAME} [${TIME_SECONDS}s] <==" | __logOutput "${STEP_COUNTER}"
    else
        local LINENO=$(gigEnvGet __ERR_LINENO)
        local FILE=$(gigEnvGet __ERR_FILE_NAME)
        echo "$(
            echo "==> STEP FAILURE: Step ${STEP_ID} ${STAGE_NAME}:${STEP_NAME} [${TIME_SECONDS}s]"
            echo "==>               Exit code ${RESULT}${FILE:+:file ${FILE}}${LINENO:+:ln ${LINENO}}"
        )" | __logOutput "${STEP_COUNTER}"
        __killGigRun
    fi
}