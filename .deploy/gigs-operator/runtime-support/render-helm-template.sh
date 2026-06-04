#!/usr/bin/bash
set -e -E -o pipefail

trap '[[ -z $(gigEnvGet __ERR_LINENO) ]] && gigEnvSet __ERR_LINENO ${LINENO} && gigEnvSet __ERR_FILE_NAME $(basename ${BASH_SOURCE})' ERR

TEMPLATE_TYPE=$(stepEnvGet TEMPLATE_TYPE)
INPUT_FILE=$(stepEnvGet STEP_FILE)
OUTPUT_FILE=$(stepEnvGet OUTPUT_FILE)
RUNTIME_OPTIONS=$(stepEnvGet RUNTIME_OPTIONS)
CHART_DIR=$(stepEnvGet CHART_DIR)
EXTRA_VALUES_FILE=$(stepEnvGet EXTRA_VALUES_FILE)

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