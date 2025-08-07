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
echo 'kubectl version'
echo
kubectl version
echo '======================='
echo

touch .env