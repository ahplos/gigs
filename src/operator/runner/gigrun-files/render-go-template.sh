#!/usr/bin/bash
set -e -o pipefail

function renderGoTemplate() {
    local INPUT_FILE=${1}
    local OUTPUT_FILE=${2}

    local __TMP_CHART_DIR=$(mktemp -d)
    cp ${$GIG_RUN_HOME}/Chart.yaml ${__TMP_CHART}

    mkdir ${__TMP_CHART_DIR}/templates
    cp {INPUT_FILE} ${__TMP_CHART_DIR}/templates

    echo "GIG_ENV: $(keydb-cli --raw HGETALL GIG_ENV | paste -d '=' - - | jo)" \
        > ${__TMP_CHART_DIR}/gig-env-values.yaml

    helm template ${__TMP_CHART_DIR} \
        -s ${__TMP_CHART_DIR}/templates/{FILE_NAME}.yaml \
        -f ${__TMP_CHART_DIR}/gig-env-values.yaml \
        --debug 2>/dev/null | sed '1,2d' \
        > {OUTPUT_FILE}

    rm -rf $(mktemp -d)
}

renderGoTemplate ${1} ${2}