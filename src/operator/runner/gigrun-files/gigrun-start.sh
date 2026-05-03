#!/usr/bin/bash -e
set -e -o pipefail -o allexport

LC_ALL=C
source ${GIG_RUN_HOME}/gigdb-helper.sh
source ${GIG_RUN_HOME}/gigrun-utils.sh

set +o allexport

gigdb-server --daemonize yes

trap 'echo "$(__gigRunFooter $?)" |& __logOutput "--"' EXIT

SECRETS_FILE="${GIG_RUN_HOME}/{{ gig_mod.namespace }}_{{ gig_mod.name }}/.secrets"
gigSecretsAdd $(cat ${SECRETS_FILE} | xargs)

__LOG_FILE=$(mktemp)

__checkForAbortSignal |& __logOutput '--' &

${GIG_RUN_HOME}/{{ gig_mod.namespace }}_{{ gig_mod.name }}/gigrunner.sh | __logFilteredOutput ${__LOG_FILE} &
sleep 1
tail -q --pid $(gigEnvGet GIG_PID) -f ${__LOG_FILE} -n +1 2>/dev/null

exit $(cat .stagerunner_exit_status 2>/dev/null || echo 1)
