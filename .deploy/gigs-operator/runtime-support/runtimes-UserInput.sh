#!/usr/bin/bash
trap '[[ -z $(gigEnvGet __ERR_LINENO) ]] && gigEnvSet __ERR_LINENO ${LINENO} && gigEnvSet __ERR_FILE_NAME $(basename ${BASH_SOURCE})' ERR

set -e -E

function __runUserInput() {
    local CHART_DIR=$(mktemp -d)
    local NEW_GIGRUN_FILE=${CHART_DIR}/${STEP_ID}_gigrun_patch.yaml
    local USER_INPUT_CONFIG_FILE=${CHART_DIR}/${STEP_ID}_user_input

    stepEnvSet OUTPUT_FILE ${USER_INPUT_CONFIG_FILE}
    stepEnvSet CHART_DIR ${CHART_DIR}
    __render$(stepEnvGet RUNTIME)Template

    stepEnvSet STEP_FILE ${GIGRUN_DEFAULT_SCRIPTS_HOME}/user-input-patch.yaml
    stepEnvSet EXTRA_VALUES_FILE ${USER_INPUT_CONFIG_FILE}
    stepEnvSet OUTPUT_FILE ${NEW_GIGRUN_FILE}
    __renderHelmTemplate

    __waitForUserInput ${NEW_GIGRUN_FILE}

    rm -rf ${CHART_DIR}
}