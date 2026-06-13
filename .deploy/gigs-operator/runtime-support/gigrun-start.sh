#!/usr/bin/bash -e
set -e -E -o pipefail -o allexport

GIGMOD_DIR=${1}

LC_ALL=C
source ${GIGRUN_DEFAULT_SCRIPTS_HOME}/gigdb-helper.sh
source ${GIGRUN_DEFAULT_SCRIPTS_HOME}/gigrun-utils.sh

source ${GIGRUN_DEFAULT_SCRIPTS_HOME}/gigrun-headers.sh
source ${GIGRUN_DEFAULT_SCRIPTS_HOME}/gigrun-logging.sh

source ${GIGRUN_DEFAULT_SCRIPTS_HOME}/runtimes-Script.sh
source ${GIGRUN_DEFAULT_SCRIPTS_HOME}/runtimes-Template.sh
source ${GIGRUN_DEFAULT_SCRIPTS_HOME}/runtimes-UserInput.sh

export PYTHONPATH=$PYTHONPATH:${GIGRUN_DEFAULT_SCRIPTS_HOME}

set +o allexport

gigdb-server --daemonize yes --protected-mode yes --appendonly no
(
    gigdb-cli CONFIG SET save ""
    gigdb-cli CLIENT TRACKING off
) >/dev/null

__initNode

trap 'echo "$(__gigRunFooter $?)" |& __logOutput' EXIT

export __LOG_FILE=$(mktemp)

__checkForAbortSignal |& __logOutput &

${GIGRUN_HOME}/${GIGMOD_DIR}/gigrunner.sh >>${__LOG_FILE} &
sleep 1
tail -q --pid $(gigEnvGet GIG_PID) -f ${__LOG_FILE} -n +1 2>/dev/null

kubectl delete --ignore-not-found secret -n ${GIGRUN_NAMESPACE} ${GIGRUN_NAME} &>/dev/null
exit $(gigEnvGet EXIT_STATUS || echo 1)
