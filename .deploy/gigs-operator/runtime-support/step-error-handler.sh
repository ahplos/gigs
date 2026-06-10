#!/usr/bin/bash
set -e -E -o pipefail

trap '__handleRuntimeError' ERR

function __handleRuntimeError() {
    local ERROR_CODE=$?

    echo 'ERROR [Stack Trace]:'
    for ((i = 1; i < ${#FUNCNAME[@]}; i++)); do
        local FUNCTION="${FUNCNAME[$i]}"
        local FILE="${BASH_SOURCE[$i]}"
        local LINE="${BASH_LINENO[$((i - 1))]}"
        echo "  at ${FUNCTION}() in ${FILE}:${LINE}"
    done

    stepEnvSet __STEP_RESULT ${ERROR_CODE}
    exit ${ERROR_CODE}
}