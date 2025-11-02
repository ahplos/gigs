#!/usr/bin/bash -e
set -o pipefail

set -o allexport

LC_ALL=C
GIG_RUN_START_TIME=$(date +%s)
source ${GIG_RUN_HOME}/gigrun-utils.sh

set +o allexport

LOGGING_END_CHAR="$(printf '\xE2\x90\x83-')"
trap '__gigRunFooter $? | __filterStageLogOutput "${LOGGING_END_CHAR}" | tee gig.log' EXIT

touch .secrets .env gig.log

SECRETS_FILE="${GIG_RUN_HOME}/{{ gig_mod.namespace }}_{{ gig_mod.name }}/.secrets"
if [[ -f ${SECRETS_FILE} ]]
then
    echo $(cat ${SECRETS_FILE}) >> .secrets
fi

${GIG_RUN_HOME}/{{ gig_mod.namespace }}_{{ gig_mod.name }}/gigrunner.sh >> gig.log &
PID=$!
__checkForAbortSignal ${PID} | __filterStageLogOutput ${LOGGING_END_CHAR} | tee gig.log &
tail -q --pid ${PID} -f gig.log -n +1 2> /dev/null

exit $([ -f .stagerunner_exit_status ] && cat .stagerunner_exit_status)

