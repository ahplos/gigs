#!/usr/bin/bash
trap '[[ -z $(gigEnvGet __ERR_LINENO) ]] && gigEnvSet __ERR_LINENO ${LINENO} && gigEnvSet __ERR_FILE_NAME $(basename ${BASH_SOURCE})' ERR

set -e -E

function __runGoStep() {
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

function __runUserInput() {
    local CHART_DIR=$(mktemp -d)
    local NEW_GIGRUN_FILE=${CHART_DIR}/${STEP_ID}_gigrun_patch.yaml
    local USER_INPUT_CONFIG_FILE=${CHART_DIR}/${STEP_ID}_user_input

    setEnvStep OUTPUT_FILE ${USER_INPUT_CONFIG_FILE}
    setEnvStep CHART_DIR ${CHART_DIR}
    __render$(stepEnvGet RUNTIME_TYPE)Template

    setEnvStep STEP_FILE ${NEW_GIGRUN_FILE}
    setEnvStep EXTRA_VALUES_FILE USER_INPUT_CONFIG_FILE
    setEnvStep OUTPUT_FILE ${GIGRUN_FILE}
    __renderHelmTemplate

    __waitForUserInput ${NEW_GIGRUN_FILE}

    rm -rf ${CHART_DIR}
}

__renderHelmTemplate() {
    local TEMPLATE_TYPE=$(stepEnvGet TEMPLATE_TYPE)
    local INPUT_FILE=$(stepEnvGet STEP_FILE)
    local OUTPUT_FILE=$(stepEnvGet OUTPUT_FILE)
    local RUNTIME_OPTIONS=$(stepEnvGet RUNTIME_OPTIONS)
    local CHART_DIR=$(stepEnvGet CHART_DIR)
    local EXTRA_VALUES_FILE=$(stepEnvGet EXTRA_VALUES_FILE)

    (
        cd ${CHART_DIR}
        cp ${GIGRUN_HOME}/Chart.yaml .
        if [[ ${EXTRA_VALUES_FILE} && ! -f $(basename ${EXTRA_VALUES_FILE}) ]]
        then
            cat ${EXTRA_VALUES_FILE}
        fi

        mkdir -p templates
        cp ${INPUT_FILE} templates/template.yaml

        echo '{ "gigEnv": '$(gigEnvToJson)' }, "stageEnv": '$(stageEnvToJson)' }' >values.yaml

        DEBUG=$([[ ${TEMPLATE_TYPE} == 'Go' ]] && echo '--debug' || echo '')
        helm template ${DEBUG} -f values.yaml ${EXTRA_VALUES_FILE:+-f ${EXTRA_VALUES_FILE}} ${RUNTIME_OPTIONS@P} . ${DEBUG:+2>/dev/null} | sed '1,2d' >${OUTPUT_FILE}
        echo 'TEMPLATE RENDERED:'
        echo '==='
        cat ${OUTPUT_FILE}
        echo '==='
    )
}

__renderJaveScriptTemplate() {
    node ${GIGRUN_HOME}/render-javascript-literal-template.sh
}

__renderJinjaTemplate() {
    python ${GIGRUN_HOME}/render-jinja-template.py ${INPUT_FILE} ${OUTPUT_FILE}
}

__renderShellTemplate() {
    envsubst $(stepEnvGet STEP_FILE) > $(stepEnvGet OUTPUT_FILE)
}