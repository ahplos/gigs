#!/usr/bin/bash
trap '[[ -z $(gigEnvGet __ERR_LINENO) ]] && gigEnvSet __ERR_LINENO ${LINENO} && gigEnvSet __ERR_FILE_NAME $(basename ${BASH_SOURCE})' ERR

set -e -o allexport

GIG_ENV="$(gigEnvToJson)
STAGE_ENV="$(stageEnvToJson)

set +o allexport

function executeRuntime() {

    export CURRENT_WORKDIR=$(pwd)
    local RUNTIME=$(stepEnvGet RUNTIME)
    case ${RUNTIME} in
        Custom)
            (
                set -x
                "$(stepEnvGet RUNTIME_SCRIPT)"
            )
        ;;

        GigRun)
        ;;

        'Go')
            (
                TEMP_DIR=$(mktemp -d)
                cd ${TEMP_DIR}
                cp ${GIGRUN_HOME}/gigdb-helper.go .
                cp ${HOME} go.* ${STEPRUN_GO} .
                LOCAL_STEPRUN_GO=$(basename ${STEPRUN_GO})
                echo >> ${LOCAL_STEPRUN_GO}
                echo 'func main() {' >> ${LOCAL_STEPRUN_GO}
                cat $(stepEnvGet STEP_FILE) >> ${LOCAL_STEPRUN_GO}
                echo '}'
                goimports -w ${LOCAL_STEPRUN_GO}
                set -x
                go run . $(stepEnvGet CLI_ARGS)
                { set +x; } 2>/dev/null
                rm -rf pod${TEMP_DIR}
            )
        ;;

        JavaScript)
            (
                set -x
                node --import=${GIGRUN_HOME}/gigdb-helper.js $(stepEnvGet STEP_FILE) $(stepEnvGet CLI_ARGS)
            )
        ;;

        Python)
            python -m trace --trace --ignore-dir=$(python -c 'import sys; print(":".join(sys.path[1:]))') \
                $(stepEnvGet STEP_FILE) $(stepEnvGet CLI_ARGS)
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

            renderTemplate $(stepEnvGet STEP_FILE) ${USER_INPUT_VALUES} ${CHART_DIR} > /dev/null

            renderTemplate ${GIGRUN_HOME}/user-input-patch.yaml ${GIGRUN_PATCH_FILE} ${CHART_DIR} ${USER_INPUT_VALUES}

            __waitForUserInput ${CHART_DIR}/${STEP_ID}_gigrun_patch.yaml

            rm -rf ${CHART_DIR}
        ;;

        *)
            echo "ERROR: UNKNOWN RUNTIME ${RUNTIME:+'[${RUNTIME}]'}"
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
            ${GIGRUN_HOME}/render-helm-template.sh ${TEMPLATE_FILE} ${RENDERED_FILE} ${3} ${4}
        ;;

        Helm)
            ${GIGRUN_HOME}/render-helm-template.sh ${TEMPLATE_FILE} ${RENDERED_FILE} ${3} ${4}
        ;;

        JavaScriptLiteral)
            ${GIGRUN_HOME}/render-javascript-literal-template.sh
        ;;

        Jinja)
            python ${GIGRUN_HOME}/jinja_stage.py
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

executeRuntime 2>&1
