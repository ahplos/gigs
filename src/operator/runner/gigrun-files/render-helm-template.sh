#!/usr/bin/bash -e
set -e -o pipefail
function renderHelmTemplate() {
    local OUTPUT_FILE=${1}
    local __TMP_CHART_DIR=$(mktemp -d)

    cp ${$GIG_RUN_HOME}/Chart.yaml ${__TMP_CHART}
    mkdir ${__TMP_CHART_DIR}/templates

    echo "GIG_ENV: $(keydb-cli --raw HGETALL GIG_ENV | paste -d '=' - - | jo)" \
        > ${__TMP_CHART_DIR}/gig-env-values.yaml
    cp {FILE_NAME} ${__TMP_CHART_DIR}/templates
    helm template ${__TMP_CHART_DIR} \
        -s ${__TMP_CHART_DIR}/templates/{FILE_NAME}.yaml \
        -f ${__TMP_CHART_DIR}/env-values.yaml \
        --debug 2>/dev/null | sed '1,2d' \
        > {STAGE_NAME}_{STEP_NAME}
    rm -rf $(mktemp -d)
}

renderHelmTemplate ${1}