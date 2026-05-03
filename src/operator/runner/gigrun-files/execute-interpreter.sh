#!/usr/bin/bash
set -e -o pipefail

trap 'stepEnvSet LINENO ${LINENO}' ERR

set -o allexport

GIG_ENV="$(gigEnvToJson)
STAGE_ENV="$(stageEnvToJson)

set -e - o pipefail +o allexport

function executeInterpreter() {

    local INTERPRETER=$(stepEnvGet INTERPRETER)
    case ${INTERPRETER} in
        Custom)
            bash -cxe $(stepEnvGet CLI_ARGS)
        ;;

        GigRun)
        ;;

        'Go')
            go run $(stepEnvGet STEP_FILE) $(stepEnvGet CLI_ARGS)
        ;;

        JavaScript)
            node $(stepEnvGet STEP_FILE) $(stepEnvGet CLI_ARGS)
        ;;

        Python)
            python -m trace -t $(stepEnvGet STEP_FILE) $(stepEnvGet CLI_ARGS)
        ;;

        Shell)
            $(stepEnvGet STEP_FILE) $(stepEnvGet CLI_ARGS)
        ;;

        Template)
            renderTemplate $(stepEnvGet STEP_FILE) $(stepEnvGet STEP_FILE)
        ;;

        UserInput)
            local USER_INPUT_VALUES=${HOME}/${STEP_ID}_user_input
            local GIGRUN_PATCH_FILE=${STEP_ID}_gigrun_patch.yaml

            local CHART_DIR=$(mktemp -d)

            renderTemplate $(stepEnvGet STEP_FILE) ${USER_INPUT_VALUES} ${CHART_DIR}

            renderTemplate ${GIG_RUN_HOME}/user-input-patch.yaml ${GIGRUN_PATCH_FILE} ${CHART_DIR} ${USER_INPUT_VALUES}

            __waitForUserInput ${CHART_DIR}/${STEP_ID}_gigrun_patch.yaml

            rm -rf ${CHART_DIR}
        ;;

        *)
            echo "ERROR: UNKNOWN INTERPRETER ${INTERPRETER:+'[${INTERPRETER}]'}"
            exit 1
        ;;
    esac
}

function renderTemplate() {
    local TEMPLATE_FILE=${1}
    local RENDERED_FILE=${2}
    echo
    case $(stepEnvGet TEMPLATE_TYPE) in
        Go)
            ${GIG_RUN_HOME}/render-helm-template.sh ${TEMPLATE_FILE} ${RENDERED_FILE} ${3} ${4}
        ;;

        Helm)
            ${GIG_RUN_HOME}/render-helm-template.sh ${TEMPLATE_FILE} ${RENDERED_FILE} ${3} ${4}
        ;;

        JavaScriptLiteral)
            ${GIG_RUN_HOME}/render-javascript-literal-template.sh
        ;;

        Jinja)
            python ${GIG_RUN_HOME}/jinja_stage.py
        ;;
        Shell)
        ;;
        *)
            local TEMPLATE_TYPE=$(stepEnvGet TEMPLATE_TYPE)
            echo "ERROR: UNKNOWN TEMPLATE TYPE ${TEMPLATE_TYPE:+'[${TEMPLATE_TYPE}]'}"
            exit 1
        ;;
    esac
}

executeInterpreter
