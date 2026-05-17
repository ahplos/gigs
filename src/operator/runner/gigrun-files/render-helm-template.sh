#!/usr/bin/bash
set -e -E -o pipefail

trap '[[ -z $(gigEnvGet __ERR_LINENO) ]] && gigEnvSet __ERR_LINENO ${LINENO} && gigEnvSet __ERR_FILE_NAME $(basename ${BASH_SOURCE})' ERR

TEMPLATE_FILE=${1}
RENDERED_FILE=${2}
CHART_DIR=${3}
EXTRA_VALUES_FILE=${4}

(
    cd ${CHART_DIR}
    cp ${GIGRUN_HOME}/Chart.yaml .
    if [[ ${EXTRA_VALUES_FILE} && ! -f $(basename ${EXTRA_VALUES_FILE}) ]]
    then
        cat ${EXTRA_VALUES_FILE}
    fi

    mkdir -p templates
    cp ${TEMPLATE_FILE} templates/template.yaml

    echo '{ "gigEnv": '$(gigEnvToJson)' }, "stageEnv": '$(stageEnvToJson)' }' >values.yaml

    helm template --debug -f values.yaml ${EXTRA_VALUES_FILE:+-f ${EXTRA_VALUES_FILE}} . 2>/dev/null | sed '1,2d' >${RENDERED_FILE}
    echo 'TEMPLATE RENDERED:'
    echo '==='
    cat ${RENDERED_FILE}
    echo '==='
)