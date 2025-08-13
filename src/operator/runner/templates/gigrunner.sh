#!/usr/bin/bash
/{{ GIG_RUNNER }}/gigrun_header.sh

touch .env gig.log

set -o allexport

NONSENSE_REGEX='-__@::'

function loadStageEnv() {
    set -o allexport
    source .env
    set +o allexport
}

function waitForUserInput() {
    echo
    echo 'Waiting for user input...'

    kubectl wait gigrun/{{ gig_run.name }} \
        --timeout=600s --for=jsonpath='{.status.state}'='WaitingForInput' -n {{ gig_run.namespace }} 2>&1 /dev/null

    kubectl wait gigrun/{{ gig_run.name }} --timeout=600s --for=jsonpath='{.status.state}'='Running' -n {{ gig_run.namespace }} &> /dev/null

    fetchInputParams

    echo
    echo 'User input received; continuing...'
}

function fetchInputParams() {
    INPUT_PARAMS=$(kubectl get secret -n {{ gig_run.namespace }} {{ K8S_SECRET_NAME }} -o jsonpath='{.data}')
    if [[ ! -z ${INPUT_PARAMS} ]]
    then
        echo ${INPUT_PARAMS} | jq -r 'to_entries[]|"\(.key)=\"\(.value|@base64d)\""' | tr '"' "'" >> .env
    fi
}

function generateSecretFilter() {
    local SECRET_VARS=$(cat /{{ GIG_RUNNER }}/.secrets)
    local SECRETS_REGEX=''
    for VAR in ${SECRET_VARS}
    do
        SECRETS_REGEX+=${SECRETS_REGEX:+${!VAR:+|}}${!VAR}
    done

    SECRET_VARS=$(ls .secrets)
    for VAR in ${SECRET_VARS}
    do
        VAL="$(cat .secrets/${VAR})"
        SECRETS_REGEX+=${VAL:+${VAL:+|}}${VAL}
    done

    echo ${SECRETS_REGEX}
}

function filterLogOutput() {
    while read -r LOGS;
    do
        loadStageEnv

        SECRETS_REGEX=$(generateSecretFilter)
        echo "${LOGS}" | sed -E -e "s/${SECRETS_REGEX}/*****/g"
    done
}

function stage_footer() {
    STAGE_NAME="${1}"
    STAGE_TYPE="${2}"

    if [[ "${STAGE_TYPE}" == 'Input' ]]
    then
        waitForUserInput
    fi

    echo
    echo "==> STAGE COMPLETED: ${STAGE_NAME}"
    echo
}

set +o allexport

fetchInputParams

/{{ GIG_RUNNER }}/stagerunner.sh &
tail -q --pid $! -f gig.log -n +1
