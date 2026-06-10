#!/usr/bin/bash

function __runGoStep() {
    local RUNTIME_OPTIONS=$(stepEnvGet RUNTIME_OPTIONS)

    local TEMP_DIR=/tmp/${STEP_ID}
    local TMP_STEPRUN=${TEMP_DIR}/steprun
    local TMP_STEPRUN_GO=${TEMP_DIR}/steprun.go
    if [[ ! -f ${TMP_STEPRUN} ]]
    then
        mkdir -p ${TEMP_DIR} >/dev/null
        cd ${TEMP_DIR}
        cp ${GIGRUN_DEFAULT_SCRIPTS_HOME}/gigdb-helper.go ${HOME}/go.* ${HOME}/steprun.go .
        echo >> ${TMP_STEPRUN_GO}
        echo 'func main() {' >> ${TMP_STEPRUN_GO}
        cat $(stepEnvGet STEP_FILE) >> ${TMP_STEPRUN_GO}
        echo '}' >> ${TMP_STEPRUN_GO}
        goimports -w ${TMP_STEPRUN_GO}
        go build . ${RUNTIME_OPTIONS@P}
    fi
    echo 'EXECUTING:'
    cat ${TMP_STEPRUN_GO} | sed -e 's/^/    /g'
    echo
    local OUTPUT=$(${TMP_STEPRUN})
    echo 'OUTPUT:'
    echo ${OUTPUT:-'=> <NONE> <='} | sed -e 's/^/    /g'
}

__runJavaScriptStep() {
    (
        RUNTIME_OPTIONS="$(stepEnvGet RUNTIME_OPTIONS)"
        node --import=${GIGRUN_DEFAULT_SCRIPTS_HOME}/gigdb-helper.js $(stepEnvGet STEP_FILE) "${RUNTIME_OPTIONS@P}"
    )
}

__runPythonStep() {
    (
        RUNTIME_OPTIONS="$(stepEnvGet RUNTIME_OPTIONS)"
        STEP_FILE=$(stepEnvGet STEP_FILE)
        python -m trace --trace --ignore-dir=$(python -c 'import sys; print(":".join(sys.path[1:]))') ${STEP_FILE}  "${RUNTIME_OPTIONS@P}"
    )
}

__runShellStep() {
    (
        RUNTIME_OPTIONS="$(stepEnvGet RUNTIME_OPTIONS)"
        source $(stepEnvGet STEP_FILE) "${RUNTIME_OPTIONS@P}"
    )
}