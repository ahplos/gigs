#!/usr/bin/bash -e
set -o pipefail -o allexport

LC_ALL=C
source ${GIG_RUN_HOME}/gigdb-helper.sh
source ${GIG_RUN_HOME}/gigrun-utils.sh

set +o allexport

gigdb-server --daemonize yes

gigEnvSet LOGGING_END_CHAR $(printf '\xE2\x90\x83-')

trap '__gigRunFooter $? | __logOutput "$(gigEnvGet LOGGING_END_CHAR)" | tee gig.log' EXIT

touch gig.log

SECRETS_FILE="${GIG_RUN_HOME}/{{ gig_mod.namespace }}_{{ gig_mod.name }}/.secrets"
gigSecretsAdd $(cat ${SECRETS_FILE} | xargs)

${GIG_RUN_HOME}/{{ gig_mod.namespace }}_{{ gig_mod.name }}/gigrunner.sh >> gig.log &
gigEnvSet GIG_PID $!
# __checkForAbortSignal | __logOutput "$(gigEnvGet LOGGING_END_CHAR)" | tee gig.log &
tail -q --pid $(gigEnvGet GIG_PID) -f gig.log -n +1 2> /dev/null

exit $(cat .stagerunner_exit_status 2>/dev/null || echo 1)
