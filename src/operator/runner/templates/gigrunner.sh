#!/usr/bin/bash
/{{ GIG_RUNNER }}/gigrun_header.sh

touch .env .secrets .stage-secrets

NONSENSE_REGEX='-__@::'

function loadStageEnv() {
    set -o allexport
    source .env
    set +o allexport
}
export -f loadStageEnv

function waitForUserInput() {
    echo
    echo 'Waiting for user input...'

    kubectl wait gigrun/{{ gig_run.name }} \
        --timeout=600s --for=jsonpath='{.status.state}'='WaitingForUserInput' -n {{ gig_run.namespace }} &> /dev/null

    kubectl wait gigrun/{{ gig_run.name }} --timeout=600s --for=jsonpath='{.status.state}'='Running' -n {{ gig_run.namespace }} &> /dev/null

    echo
    echo 'User input recieved; continuing...'
}
export -f waitForUserInput

function generateSecretFilter() {
    local SECRET_VARS=$(cat /{{ GIG_RUNNER }}/.secrets)$'\n'$(cat .secrets)
    for VAR in ${SECRET_VARS}
    do
        local VAL=${!VAR:-${NONSENSE_REGEX}}
        local SECRETS_REGEX+=${PIPE}${VAL}
        PIPE='|'
    done
    echo ${SECRETS_REGEX}
}

function filterLogOutput() {
    while read -r LOGLINE; do
        local SECRET_FILTER=$(generateSecretFilter)
        echo "${LOGLINE}" | sed -E -e "s/${SECRET_FILTER:-${NONSENSE_REGEX}}/*****/g"
    done
}

/{{ GIG_RUNNER }}/stagerunner.sh >gig.log 2>&1 &
tail -q --pid $! -f gig.log -n +1 | filterLogOutput


