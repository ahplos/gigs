#!/usr/bin/bash
set -e -E -o pipefail

trap '[[ -z $(gigEnvGet __ERR_LINENO) ]] && gigEnvSet __ERR_LINENO ${LINENO} && gigEnvSet __ERR_FILE_NAME $(basename ${BASH_SOURCE})' ERR

TEMPLATE_TYPE=${1}
INPUT_FILE=${2}
OUTPUT_FILE=${3}
CLI_ARGS=${4}
CHART_DIR=${5}
EXTRA_VALUES_FILE=${6}

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
    helm template ${DEBUG} -f values.yaml ${EXTRA_VALUES_FILE:+-f ${EXTRA_VALUES_FILE}} . ${DEBUG:+2>/dev/null} | sed '1,2d' >${OUTPUT_FILE}
    echo 'TEMPLATE RENDERED:'
    echo '==='
    cat ${OUTPUT_FILE}
    echo '==='
)