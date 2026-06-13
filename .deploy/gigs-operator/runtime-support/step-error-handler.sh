#!/usr/bin/bash
set -e -E -o pipefail

trap 'ERROR_CODE=$?; { set +x; } 2>/dev/null; __handleRuntimeError ${ERROR_CODE}' ERR

function __handleRuntimeError() {
    local ERROR_CODE=${1}

    local STACK_TRACE=$(
        echo 'ERROR [Stack Trace]:'
        for ((i = 1; i < ${#FUNCNAME[@]}; i++)); do
            local FUNCTION="${FUNCNAME[$i]}"
            local FILE="${BASH_SOURCE[$i]}"
            local LINE="${BASH_LINENO[$((i - 1))]}"
            echo "  at ${FUNCTION}() in ${FILE}:${LINE}"
        done
    )

    stepEnvSet __STACK_TRACE "${STACK_TRACE}"
    stepEnvSet __STEP_RESULT ${ERROR_CODE}
    exit ${ERROR_CODE}
}