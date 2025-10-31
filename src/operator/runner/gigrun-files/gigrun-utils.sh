#!/usr/bin/bash -e

__HEADER_FOOTER_BORDER='******************************************************************'
__HEADER_FOOTER_PREFIX='**'

function __loadStageEnv() {
    set -o allexport
    source .env
    set +o allexport
}

function __convertJsonDictToEnv() {
    JSON="${1}"
    KEY_PREFIX=${2}
    BASE64=${3:+|@base64d}

    echo $(echo "${JSON}" | jq -r 'to_entries[]|"'${KEY_PREFIX}'\(.key)=\"\(.value'${BASE64}')\""' | tr '"' "'")
}

function __saveInputParamsToEnv() {
    INPUT_PARAMS=$(kubectl get secret -n {{ gig_run.namespace }} {{ gig_run.name }} -o jsonpath='{.data}')
    if [[ ! -z ${INPUT_PARAMS} ]]
    then
        INPUT_PARAMS=$(__convertJsonDictToEnv ${INPUT_PARAMS} '' TRUE | tr ' ' '\n')
        echo "${INPUT_PARAMS}" > .env
        echo
        echo "${__HEADER_FOOTER_BORDER}"
        echo "${__HEADER_FOOTER_PREFIX} INPUT PARAMS RECEIVED:"
        echo "${__HEADER_FOOTER_PREFIX}"
        echo "${INPUT_PARAMS}" | awk -v PREFIX="${__HEADER_FOOTER_PREFIX}" '{ print PREFIX "    " $0 }'
        echo "${__HEADER_FOOTER_BORDER}"

        kubectl patch secret -n {{ gig_run.namespace }} {{ gig_run.name }} --patch 'data:' 2>&1 > /dev/null
    fi
}

function __waitForUserInput() {
    python ${GIG_RUN_HOME}/jinja_stage.py ${1}

    kubectl patch gigrun ${GIG_RUN_NAME} -n ${POD_NAMESPACE} --patch-file user_input_patch.yaml --type='merge' 2>&1 > /dev/null

    echo 'Waiting for user input...'

    kubectl wait gigrun/{{ gig_run.name }} --timeout=600s --for=jsonpath='{.spec.runState}'='Running' -n {{ gig_run.namespace }} &> /dev/null

    __saveInputParamsToEnv

    echo 'User input received; continuing...'
}

function __checkForAbortSignal() {
    PID=${1}
    kubectl wait gigrun/{{ gig_run.name }} -n {{ gig_run.namespace }} \
        --timeout={{ GIG_TIMEOUT }}s --for=jsonpath='{.spec.runState}'='Aborting'

    echo "ABORT RUN..." > gig.log
    set -x
    timeout 30s pkill -P ${PID} || pkill --signal KILL ${PID}
    set +x
}

function __generateSecretFilter() {
    local SECRET_VARS=$(cat .secrets)
    local SECRETS_REGEX=''
    for VAR in ${SECRET_VARS}
    do
        SECRETS_REGEX+=${SECRETS_REGEX:+${!VAR:+|}}${!VAR}
    done

    echo ${SECRETS_REGEX}
}

function __filterStageLogOutput() {
    local __DELIM=$'\x1F'
    while read -r LOGS
    do
        local NEW_LOGS="[${1}"
        if [[ ${LOGS} =~ ^- ]]
        then
            NEW_LOGS="${NEW_LOGS}${LOGS}"
        else
            local GIG_RUN_TIME=$(echo $(($(date +%s) - ${GIG_RUN_START_TIME})))
            NEW_LOGS="${NEW_LOGS}-G  $(date -d@${GIG_RUN_TIME} -u +%Hh:%Mm:%Ss)] ${LOGS}"
        fi

        __loadStageEnv
        SECRETS_REGEX=$(__generateSecretFilter)
        if [[ -z ${SECRETS_REGEX} ]]
        then
            echo "${NEW_LOGS}"
        else
            echo "${NEW_LOGS}" | sed -E -e "s${__DELIM}${SECRETS_REGEX}${__DELIM}*****${__DELIM}g"
        fi
    done
}

function __filterStepLogOutput() {
    while read -r LOGS
    do
        local GIG_RUN_TIME=$(echo $(($(date +%s) - ${GIG_RUN_START_TIME})))
        echo "-${1}  $(date -d@${GIG_RUN_TIME} -u +%Hh:%Mm:%Ss)] ${LOGS}"
    done
}

function __gigRunHeader() {
    echo "${__HEADER_FOOTER_BORDER}"
    echo "${__HEADER_FOOTER_PREFIX} GIG: {{ gig_mod.name }}"
    {%- if gig_mod.spec.description %}
    echo "${__HEADER_FOOTER_PREFIX} {{ gig_mod.spec.description }}"
    {%- endif %}
    echo "${__HEADER_FOOTER_PREFIX} $(date)"
    echo "${__HEADER_FOOTER_PREFIX}"
    KUBE_EXEC=kubectl
    type oc >/dev/null 2>&1
    if [[ $? ]]
    then
        KUBE_EXEC=oc
    fi
    echo "${__HEADER_FOOTER_PREFIX} ${KUBE_EXEC} version"
    ${KUBE_EXEC} version | sed "s/^\(.*\)/${__HEADER_FOOTER_PREFIX} \1/g"
    echo "${__HEADER_FOOTER_BORDER}"

    __saveInputParamsToEnv
}

function __gigRunFooter() {
    echo
    echo "${__HEADER_FOOTER_BORDER}"
    echo "${__HEADER_FOOTER_PREFIX} GIG COMPLETE"
    echo "${__HEADER_FOOTER_PREFIX}"
    echo "** $(date)"
    echo "${__HEADER_FOOTER_BORDER}"
}

function __stageHeader() {
    local STAGE_ID=${1}
    local STAGE_NAME=${2}
    local STAGE_TYPE="${3}"

    local STAGE_HEADER=$(
        echo
        echo "${__HEADER_FOOTER_BORDER}"
        echo "${__HEADER_FOOTER_PREFIX} STAGE ${STAGE_ID}: ${STAGE_NAME}"
        echo "${__HEADER_FOOTER_PREFIX}       $(date)"

        if [[ ${STAGE_TYPE} == 'SKIPPED' ]]
        then
            echo "${__HEADER_FOOTER_PREFIX}"
            echo "${__HEADER_FOOTER_PREFIX} WARNING: STAGE SKIPPED [Precondition(s) for execution failed]"
        fi

        echo "${__HEADER_FOOTER_BORDER}"
    )

    echo "${STAGE_HEADER}"
}

function __stepHeader() {
    local STEP_ID=${1}
    local STAGE_NAME=${2}
    local STEP_NAME=${3}
    local STEP_INTERPRETER=${4}
    local STAGE_TYPE=${5}

    local STEP_HEADER=$(
        echo
        echo "${__HEADER_FOOTER_BORDER}"
        echo "${__HEADER_FOOTER_PREFIX} Step ${STEP_ID}: ${STAGE_NAME}:${STEP_NAME}"
        echo "${__HEADER_FOOTER_PREFIX} Interpreter: ${STEP_INTERPRETER}"

        if [[ ${STAGE_TYPE} == 'HAS_SECRETS' ]]
        then
            echo "${__HEADER_FOOTER_PREFIX} WARNING: SECRETS REALIZED [Logging output suppressed]"
        elif [[ ${STAGE_TYPE} == 'SKIPPED' ]]
        then
            echo "${__HEADER_FOOTER_PREFIX} WARNING: STEP SKIPPED [Precondition(s) for execution failed]"
        fi

        echo "${__HEADER_FOOTER_BORDER}"
    )

    echo "${STEP_HEADER}"
}

function __testWhen() {
    local GIG_MOD_DIR_NAME=${1}
    local STAGE_OR_STEP_TEST_JS="when-${2}.js"

    if [[ -f ${GIG_RUN_HOME}/${GIG_MOD_DIR_NAME}/${STAGE_OR_STEP_TEST_JS} ]]
    then
        node ${GIG_RUN_HOME}/${GIG_MOD_DIR_NAME}/${STAGE_OR_STEP_TEST_JS}
    fi
}