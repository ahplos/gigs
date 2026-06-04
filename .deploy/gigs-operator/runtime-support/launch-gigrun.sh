#!/usr/bin/bash
set -e -o pipefail

trap '[[ -z $(gigEnvGet __ERR_LINENO) ]] && gigEnvSet __ERR_LINENO ${LINENO} && gigEnvSet __ERR_FILE_NAME $(basename ${BASH_SOURCE})' ERR

LAUNCH_GIG_NAME=${1}
NAMESPACE=${2}
INPUT_VALUES=${3}

if [[ -n ${NAMESPACE} ]]
then
    NAMESPACE=$(kubectl get namespace --ignore-not-found -o name ${NAMESPACE})
    NAMESPACE=$(NAMESPACE:-$(gigEnvGet ${NAMESPACE}))
    if [[ -z ${NAMESPACE} ]]
    then
        exit 1
    fi
fi
NAMESPACE=${NAMESPACE:-${GIGRUN_NAMESPACE}}

CHART_DIR=$(mktemp -d)
cd ${CHART_DIR}
mkdir -p templates
cp ${GIGRUN_HOME}/Chart.yaml .
cp ${GIGRUN_HOME}/gigrunTemplate.yaml ./templates

helm template --set-literal inputValues="${INPUT_VALUES}" ${LAUNCH_GIG_NAME} . > gigrun.yaml
echo 'GENERATING GIGRUN:'
cat gigrun.yaml | sed -e 's/^/    /g'
GIGRUN_NAME=$(kubectl create -f gigrun.yaml -n ${NAMESPACE} -o name)

kubectl wait ${GIGRUN_NAME} --timeout=600s --for=jsonpath='{.status.runTime}' -n ${NAMESPACE} >/dev/null

if [[ $? != 0 || $(kubectl get ${GIGRUN_NAME} -n ${NAMESPACE} -o jsonpath='{.spec.runState}') != 'Succeeded' ]]
then
    echo "ERROR: Child GigRun ${GIGRUN_NAME} $(kubectl get gigrun ${GIGRUN_NAME} -o jsonpath='{.spec.runState}')"
    __killGigRun
fi

rm -rf ${CHART_DIR}