#!/usr/bin/bash -e
set -e

set -o allexport

GIG_RUN_START_TIME=$(date +%s)
source ${GIG_RUN_HOME}/gigrun-utils.sh

set +o allexport

touch .secrets .env gig.log

SECRETS_FILE="${GIG_RUN_HOME}/{{ gig_mod.namespace }}_{{ gig_mod.name }}/.secrets"
if [[ -f ${SECRETS_FILE} ]]
then
    echo $(cat ${SECRETS_FILE}) >> .secrets
fi

${GIG_RUN_HOME}/{{ gig_mod.namespace }}_{{ gig_mod.name }}/gigrunner.sh >> gig.log &
PID=$!
__checkForAbortSignal ${PID} &
tail -q --pid ${PID} -f gig.log -n +1

exit $([ -f .stagerunner_exit_status ] && cat .stagerunner_exit_status)

