#!/usr/bin/bash
set -e -o pipefail set

set -o allexport

GIG_ENV="$(gigEnvGetJson)
STAGE_ENV="$(stageEnvGetJson)

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
            go run $(stepEnvGet FILE_NAME) $(stepEnvGet CLI_ARGS)
        ;;

        JavaScript)
            node$(stepEnvGet FILE_NAME) $(stepEnvGet CLI_ARGS)
        ;;

        Python)
            python -m trace -t$(stepEnvGet FILE_NAME) $(stepEnvGet CLI_ARGS)
        ;;

        Shell)
            $(stepEnvGet STEP_FILE_PATH) $(stepEnvGet CLI_ARGS)
        ;;

        Template)
            renderTemplate
        ;;

        UserInput)
            renderTemplate

            __waitForUserInput
        ;;

        *)
            echo "ERROR: UNKNOWN INTERPRETER ${INTERPRETER:+'[${INTERPRETER}]'}"
            exit 1
        ;;
    esac
}

function renderTemplate() {
    echo 'TEMPLATE RENDERED:'
    echo '==='
    echo
    case $(stepEnvGet TEMPLATE_TYPE) in
        Go)
            ${GIG_RUN_HOME}/render-go-template.sh
        ;;

        Helm)
            ${GIG_RUN_HOME}/render-helm-template.sh
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
    cat $(stepEnvGet FILE_NAME)
    echo
    echo '==='
}

executeInterpreter
