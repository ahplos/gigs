#!/usr/bin/bash -e

set -o allexport
GIG_RUN_START_TIME=$(date +%s)

source gigrunner_utils.sh
set +o allexport

touch .secrets .env gig.log

echo "$(__gigRunHeader)" 2>&1 >> gig.log

${GIG_RUNNER_HOME}/{{ gig_mod.namespace }}-{{ gig_mod.name }}/stagerunner.sh >> gig.log &
PID=$!
__checkForAbortSignal ${PID} &
tail -q --pid ${PID} -f gig.log -n +1

__gigRunFooter | tee gig.log

exit $([ -f .stagerunner_exit_status ] && cat .stagerunner_exit_status)

