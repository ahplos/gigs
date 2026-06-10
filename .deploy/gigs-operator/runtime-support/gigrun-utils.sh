#!/usr/bin/bash

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
    local MODULE_INPUT_PARAMS=(${GIGRUN_INPUT_PARAMS})
    local JSON_INPUT_VALUES=$(kubectl get secret --ignore-not-found \
                                                -n ${GIGRUN_NAMESPACE} ${GIGRUN_NAME} \
                                                -o jsonpath='{.data.inputValues}' | base64 --decode)
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

        kubectl patch secret -n ${GIGRUN_NAMESPACE} ${GIGRUN_NAME} --patch 'data:' &>/dev/null
    else
        echo "${__HEADER_FOOTER_PREFIX} NO INPUT PARAMS RECEIVED"
    fi

    echo "${__HEADER_FOOTER_BORDER}"
}

function __verifyInputParams() {
    for REQ_INPUT_PARAM in ${GIGRUN_REQUIRED_INPUT_PARAMS}
    do
        if [[ -z $(gigEnvGet ${REQ_INPUT_PARAM}) ]]
        then
            echo "ERROR: Missing required input parameter ${REQ_INPUT_PARAM}" |& __logOutput '--'
            exit 1
        fi
    done
}

function __waitForUserInput() {
    local USER_INPUT_PATCH=${1}

    kubectl patch gigrun ${GIGRUN_NAME} \
            -n ${GIGRUN_NAMESPACE} \
            --patch-file ${USER_INPUT_PATCH} \
            --type='merge' \
            --warnings-as-errors >/dev/null
    if [[ $? == 0 ]]
    then
        echo 'Waiting for user input...'

        kubectl wait gigrun/${GIGRUN_NAME} --timeout=600s --for=jsonpath='{.spec.runState}'='Running' -n ${GIGRUN_NAMESPACE} >/dev/null
        __saveInputParamsToEnv

        echo
        echo 'User input received; continuing...'
    else
        return 1
    fi
}

function __checkForAbortSignal() {
    kubectl wait gigrun/${GIGRUN_NAME} \
                 -n ${GIGRUN_NAMESPACE} \
                 --timeout=${GIGRUN_ACTIVE_DEADLINE_SECONDS}s \
                 --for=jsonpath='{.spec.runState}=Aborting' \
        &>/dev/null

    __killGigRun "==> ABORT RUN REQUESTED..."
}

function __killGigRun() {
    [[ -n ${1} ]] && echo && echo "${1}"
    kubectl delete --ignore-not-found secret -n ${GIGRUN_NAMESPACE} ${GIGRUN_NAME} &>/dev/null

    local PID=$(gigEnvGet GIG_PID)
    (timeout 30s pkill -P ${PID} || pkill --signal KILL -P ${PID}) &>/dev/null
}