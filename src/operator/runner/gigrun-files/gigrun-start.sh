#!/usr/bin/bash -e
set -e -E -o pipefail -o allexport

LC_ALL=C
source ${GIGRUN_HOME}/gigdb-helper.sh
source ${GIGRUN_HOME}/gigrun-utils.sh

export PYTHONPATH=$PYTHONPATH:${GIGRUN_HOME}

set +o allexport

gigdb-server --daemonize yes --protected-mode yes --appendonly no
(
    gigdb-cli CONFIG SET save ""
    gigdb-cli CLIENT TRACKING off
) >/dev/null

__initNode

trap 'echo "$(__gigRunFooter $?)" |& __logOutput "--"' EXIT

export __LOG_FILE=$(mktemp)

__checkForAbortSignal |& __logOutput '--' &

${GIGRUN_HOME}/{{ gig_mod.namespace }}_{{ gig_mod.name }}/gigrunner.sh | __logFilteredOutput ${__LOG_FILE} &
sleep 1
tail -q --pid $(gigEnvGet GIG_PID) -f ${__LOG_FILE} -n +1 2>/dev/null

exit $(gigEnvGet EXIT_STATUS || echo 1)
