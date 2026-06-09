#!/usr/bin/bash

trap 'gigEnvSet __ERR_LINENO ${LINENO}; gigEnvSet __ERR_FILE_NAME $(basename ${BASH_SOURCE})' ERR

__HEADER_FOOTER_BORDER='******************************************************************'
__HEADER_FOOTER_PREFIX='**'

function __gigRunHeader() {
    local GIGMOD_NAME="${1}"
    local GIGMOD_DESCRIPTION="${2}"

    export CURRENT_PID=${BASHPID}
    local GIG_HEADER=$(
        echo "${__HEADER_FOOTER_BORDER}"
        echo "${__HEADER_FOOTER_PREFIX} GIG: ${GIGMOD_NAME}"
        if [[ -n "${GIGMOD_DESCRIPTION}" ]]
        then
            echo "${__HEADER_FOOTER_PREFIX} ${GIGMOD_DESCRIPTION}"
        fi
        echo "${__HEADER_FOOTER_PREFIX}   PROCESS ID: ${CURRENT_PID}"
        echo "${__HEADER_FOOTER_PREFIX}   $(date)"
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
    local STAGE_COUNTER="${1}"
    local STAGE_NAME="${2}"
    export CURRENT_PID="${3}"
    local STAGE_TYPE="${4}"

    local STAGE_HEADER=$(
        echo
        echo "${__HEADER_FOOTER_BORDER}"
        echo "${__HEADER_FOOTER_PREFIX} STAGE ${STAGE_COUNTER}: ${STAGE_NAME}"
        if [[ ${STAGE_TYPE} == 'SKIPPED' ]]
        then
            echo "${__HEADER_FOOTER_PREFIX}   SKIPPED: Precondition(s) for execution failed"
        else
            if [[ -n ${STAGE_TYPE} ]]
            then
                echo "${__HEADER_FOOTER_PREFIX}   EXTERNAL GIGRUN: ${STAGE_TYPE}"
            fi
            echo "${__HEADER_FOOTER_PREFIX}   PROCESS ID: ${CURRENT_PID}"
            echo "${__HEADER_FOOTER_PREFIX}   START: $(date)"
        fi
        echo "${__HEADER_FOOTER_BORDER}"
    )

    unset CURRENT_PID
    echo "${STAGE_HEADER}" | __logOutput "${STAGE_COUNTER}"
}

function __stepHeader() {
    local STEP_COUNTER="${1}"
    local STAGE_NAME="${2}"
    local STEP_NAME="${3}"
    local STEP_RUNTIME="${4}"
    local CURRENT_PID="${5}"
    local STEP_TYPE="${6}"

    local STEP_HEADER=$(
        echo
        echo "${__HEADER_FOOTER_BORDER}"
        echo "${__HEADER_FOOTER_PREFIX} Step ${STEP_COUNTER}: ${STAGE_NAME}:${STEP_NAME}"
        if [[ ${STEP_TYPE} == 'SKIPPED' ]]
        then
            echo "${__HEADER_FOOTER_PREFIX}   SKIPPED: Precondition(s) for execution failed"
        else
            echo "${__HEADER_FOOTER_PREFIX}   PROCESS ID: ${CURRENT_PID}"
        fi
        echo "${__HEADER_FOOTER_PREFIX}   Runtime: ${STEP_RUNTIME}"
        echo "${__HEADER_FOOTER_BORDER}"
    )

    unset CURRENT_PID
    echo "${STEP_HEADER}"  | __logOutput "${STEP_COUNTER}"
}

function __stepFooter() {
    local STEP_COUNTER="${1}"
    local STAGE_NAME="${2}"
    local STEP_NAME="${3}"
    local TIME_SECONDS="${4}"
    local FAIL_SAFE="${5}"
    local RESULT="$(stepEnvGet __STEP_RESULT)"

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
        [[ -z ${FAIL_SAFE} ]] && __killGigRun
    fi
}