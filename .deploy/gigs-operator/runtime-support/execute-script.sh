#!/usr/bin/bash
trap '[[ -z $(gigEnvGet __ERR_LINENO) ]] && gigEnvSet __ERR_LINENO ${LINENO} && gigEnvSet __ERR_FILE_NAME $(basename ${BASH_SOURCE})' ERR

set -e -o allexport

GIG_ENV="$(gigEnvToJson)
STAGE_ENV="$(stageEnvToJson)

set +o allexport

function executeScript() {
    export CURRENT_WORKDIR=$(pwd)
    local RUNTIME=$(stepEnvGet RUNTIME)
    case ${RUNTIME} in
        Custom)
            (
                set -x
                "$(stepEnvGet RUNTIME_SCRIPT)"
            )
        ;;

        'Go')
            runGoStep ${RUNTIME_OPTIONS}
        ;;

        JavaScript)
            (
                set -x
                node --import=${GIGRUN_HOME}/gigdb-helper.js $(stepEnvGet STEP_FILE) $(stepEnvGet RUNTIME_OPTIONS)
            )
        ;;

        Python)
            python -m trace --trace --ignore-dir=$(python -c 'import sys; print(":".join(sys.path[1:]))') \
                $(stepEnvGet STEP_FILE) "${RUNTIME_OPTIONS@P}"
        ;;

        Shell)
            $(stepEnvGet STEP_FILE) "${RUNTIME_OPTIONS@P}"
        ;;

        Template)
            runTemplateStep
        ;;

        UserInput)
            runUserInputStep
        ;;

        *)
            echo "ERROR: UNKNOWN RUNTIME [${RUNTIME:-null}]"
            exit 1
        ;;
    esac
}

function runGoStep() {
    local RUNTIME_OPTIONS=$(stepEnvGet RUNTIME_OPTIONS)

    local TEMP_DIR=/tmp/${STEP_ID}
    local TMP_STEPRUN=${TEMP_DIR}/steprun
    local TMP_STEPRUN_GO=${TEMP_DIR}/steprun.go
    if [[ ! -f ${TMP_STEPRUN} ]]
    then
        mkdir -p ${TEMP_DIR} >/dev/null
        cd ${TEMP_DIR}
        cp ${GIGRUN_HOME}/gigdb-helper.go ${HOME}/go.* ${HOME}/steprun.go .
        echo >> ${TMP_STEPRUN_GO}
        echo 'func main() {' >> ${TMP_STEPRUN_GO}
        cat $(stepEnvGet STEP_FILE) >> ${TMP_STEPRUN_GO}
        echo '}' >> ${TMP_STEPRUN_GO}
        goimports -w ${TMP_STEPRUN_GO}
        go build . ${RUNTIME_OPTIONS@P}
    fi
    local OUTPUT=$(${TMP_STEPRUN})
    echo 'EXECUTING:'
    echo
    cat ${TMP_STEPRUN_GO}
    echo
    echo 'OUTPUT:'
    echo
    echo ${OUTPUT:-'=> <NONE> <='}
}

function executeScript() {
    local TEMPLATE_TYPE=$(stepEnvGet TEMPLATE_TYPE)
    local INPUT_FILE=$(stepEnvGet STEP_FILE)
    local OUTPUT_FILE=$(stepEnvGet OUTPUT_FILE))
    local OUTPUT_FILE=${OUTPUT_FILE:-$(basename $(stepEnvGet STEP_FILE))}
    local RUNTIME_OPTIONS="$(stepEnvGet RUNTIME_OPTIONS)"

    case ${TEMPLATE_TYPE} in
        Go|Helm)
            local CHART_DIR=${5}
            local EXTRA_VALUES_FILE=${6}
            ${GIGRUN_HOME}/render-helm-template.sh ${TEMPLATE_TYPE} ${INPUT_FILE} ${OUTPUT_FILE} "${RUNTIME_OPTIONS}" ${CHART_DIR} "${EXTRA_VALUES_FILE}"
        ;;

        JavaScriptLiteral)
            ${GIGRUN_HOME}/render-javascript-literal-template.sh ${INPUT_FILE} ${OUTPUT_FILE}
        ;;

        Jinja)
            python ${GIGRUN_HOME}/jinja_stage.py ${INPUT_FILE} ${OUTPUT_FILE}
        ;;

        Shell)
        ;;

        *)
            echo
            echo "ERROR: UNKNOWN TEMPLATE TYPE [${TEMPLATE_TYPE:-null}]"
            exit 1
        ;;
    esac
}

function runUserInputStep() {
    local RUNTIME_OPTIONS=$(stepEnvGet RUNTIME_OPTIONS)
    local CHART_DIR=$(mktemp -d)
    local USER_INPUT_VALUES=${CHART_DIR}/${STEP_ID}_user_input
    local NEW_GIGRUN_FILE=${CHART_DIR}/${STEP_ID}_gigrun_patch.yaml


    runTemplateStep $(stepEnvGet TEMPLATE_TYPE) $(stepEnvGet STEP_FILE) ${USER_INPUT_VALUES} "${RUNTIME_OPTIONS}" ${CHART_DIR} >/dev/null

    runTemplateStep 'Helm' ${GIGRUN_HOME}/user-input-patch.yaml ${NEW_GIGRUN_FILE} "" ${CHART_DIR} ${USER_INPUT_VALUES}

    __waitForUserInput ${NEW_GIGRUN_FILE}

    rm -rf ${CHART_DIR}
}

executeScript 2>&1
