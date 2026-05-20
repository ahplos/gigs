#!/usr/bin/bash
trap '[[ -z $(gigEnvGet __ERR_LINENO) ]] && gigEnvSet __ERR_LINENO ${LINENO} && gigEnvSet __ERR_FILE_NAME $(basename ${BASH_SOURCE})' ERR

set -e -o allexport

GIG_ENV="$(gigEnvToJson)
STAGE_ENV="$(stageEnvToJson)

set +o allexport

function executeRuntime() {
    export CURRENT_WORKDIR=$(pwd)
    local RUNTIME=$(stepEnvGet RUNTIME)
    local CLI_ARGS=$(stepEnvGet CLI_ARGS)
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
                TEMP_DIR=/tmp/${STEP_ID}
                TMP_STEPRUN=${TEMP_DIR}/steprun
                TMP_STEPRUN_GO=${TEMP_DIR}/steprun.go
                if [[ ! -f ${TMP_STEPRUN} ]]
                then
                    (
                        mkdir -p ${TEMP_DIR} >/dev/null
                        cd ${TEMP_DIR}
                        cp ${GIGRUN_HOME}/gigdb-helper.go ${HOME}/go.* ${HOME}/steprun.go .
                        echo >> ${TMP_STEPRUN_GO}
                        echo 'func main() {' >> ${TMP_STEPRUN_GO}
                        cat $(stepEnvGet STEP_FILE) >> ${TMP_STEPRUN_GO}
                        echo '}' >> ${TMP_STEPRUN_GO}
                        goimports -w ${TMP_STEPRUN_GO}
                        go build . $(stepEnvGet CLI_ARGS)
                    )
                fi
                local OUTPUT=$(${TMP_STEPRUN})
                echo 'EXECUTING:'
                echo
                cat ${TMP_STEPRUN_GO}
                echo
                echo 'OUTPUT:'
                echo
                echo ${OUTPUT:-'=> <NONE> <='}
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
            $(stepEnvGet STEP_FILE) "${CLI_ARGS@P}"
        ;;

        Template)
            renderTemplate $(stepEnvGet STEP_FILE) $(stepEnvGet STEP_FILE)
        ;;

        UserInput)
            local CHART_DIR=$(mktemp -d)
            local USER_INPUT_VALUES=${CHART_DIR}/${STEP_ID}_user_input
            local GIGRUN_PATCH_FILE=${CHART_DIR}/${STEP_ID}_gigrun_patch.yaml

            renderTemplate $(stepEnvGet STEP_FILE) ${USER_INPUT_VALUES} ${CHART_DIR} >/dev/null

            renderTemplate ${GIGRUN_HOME}/user-input-patch.yaml ${GIGRUN_PATCH_FILE} ${CHART_DIR} ${USER_INPUT_VALUES}

            __waitForUserInput ${GIGRUN_PATCH_FILE}

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
