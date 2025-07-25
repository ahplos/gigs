#!/usr/bin/bash
__GIG_NAME=${1}
__GIG_DESC="${2}"

echo '======================='
echo "=> GIG: ${__GIG_NAME}"
if [[ "${__GIG_DESC}" ]]
then
    echo "${__GIG_DESC}"
fi
echo '======================='
echo
echo '======================='
echo 'kubectl version'
echo
kubectl version
echo '======================='
echo

touch .env