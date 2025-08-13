#!/usr/bin/bash
echo '======================='
echo "GIG: {{ gig_def.name }}"
if [[ "{{ gig_def.description }}" ]]
then
    echo "{{ gig_def.description }}"
fi
echo
date
echo '======================='
echo

echo '======================='
KUBE_EXEC=kubectl
which oc >/dev/null 2>&1
if [[ $? ]]
then
    KUBE_EXEC=oc
fi
echo "${KUBE_EXEC} version"
echo
${KUBE_EXEC} version
echo '======================='
echo

touch .env