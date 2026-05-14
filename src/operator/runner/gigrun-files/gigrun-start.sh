#!/usr/bin/bash -e
set -e -E -o pipefail -o allexport

LC_ALL=C
source ${GIGRUN_HOME}/gigdb-helper.sh
source ${GIGRUN_HOME}/gigrun-utils.sh

export PYTHONPATH=$PYTHONPATH:${GIGRUN_HOME}

set +o allexport

gigdb-server --daemonize yes

ALL_NPM_PACKAGES=$(ls $(npm root -g))
for FOLDER in ${GIGRUN_HOME} $(ls -d ${GIGRUN_HOME}/*/)
do
    (
        cd ${FOLDER}
        echo ${ALL_NPM_PACKAGES} | xargs -I {} npm link {} >/dev/null
    )
done

trap 'echo "$(__gigRunFooter $?)" |& __logOutput "--"' EXIT

SECRETS_FILE="${GIGRUN_HOME}/{{ gig_mod.namespace }}_{{ gig_mod.name }}/.secrets"
[[ -f ${SECRETS_FILE} ]] && gigSecretsAdd $(cat ${SECRETS_FILE} | xargs)

export __LOG_FILE=$(mktemp)

__checkForAbortSignal |& __logOutput '--' &

${GIGRUN_HOME}/{{ gig_mod.namespace }}_{{ gig_mod.name }}/gigrunner.sh | __logFilteredOutput ${__LOG_FILE} &
sleep 1
tail -q --pid $(gigEnvGet GIG_PID) -f ${__LOG_FILE} -n +1 2>/dev/null

exit $(gigEnvGet EXIT_STATUS || echo 1)
