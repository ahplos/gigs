#!/usr/bin/bash

trap 'gigEnvSet __ERR_LINENO ${LINENO}; gigEnvSet __ERR_FILE_NAME $(basename ${BASH_SOURCE})' ERR

function __initSemaphore() {
    local -n __SEM=${1}
    local MAX_PARALLEL=${2}

    exec {__SEM}<> <(:)

    seq 1 ${MAX_PARALLEL} | xargs -I{} echo >&${__SEM}
}

function __acquireSemaphores() {
    local STAGE_SEMAPHORE=${1}
    local STEP_SEMAPHORE=${2}

    [[ ! -z ${STEP_SEMAPHORE} ]] && read -u ${STEP_SEMAPHORE}
    [[ ! -z ${STAGE_SEMAPHORE} ]] && read -u ${STAGE_SEMAPHORE}
    read -u ${GIGRUN_SEMAPHORE}
}

function __releaseSemaphores() {
    local STAGE_SEMAPHORE=${1}
    local STEP_SEMAPHORE=${2}

    echo >&${GIGRUN_SEMAPHORE}
    [[ ! -z ${STAGE_SEMAPHORE} ]] && echo >&${STAGE_SEMAPHORE}
    [[ ! -z ${STEP_SEMAPHORE} ]] && echo >&${STEP_SEMAPHORE}
}

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
                echo "${__HEADER_FOOTER_PREFIX}     ${INPUT_PARAM}: $(gigEnvGet ${INPUT_PARAM} | xargs)"
            else
                echo "${__HEADER_FOOTER_PREFIX}     ${INPUT_PARAM}[IGNORED]: not declared in module"
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