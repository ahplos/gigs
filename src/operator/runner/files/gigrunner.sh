#!/usr/bin/bash
/{{ GIG_RUNNER_DIR }}/gigrun_header.sh '{{ gig_def.name }}' '{{ gig_def.description }}'

function loadEnv() {
    set -o allexport
    source .env
    set +o allexport
}

{%- for stage in gig_def.stages %}
loadEnv

/{{ GIG_RUNNER_DIR }}/stage_banner.sh '{{ stage.name }}' '{{ stage.processor }}' '{{ stage.description }}'

{%- if 'command' in stage %}
{%- set STAGE_SCRIPT = '/{}/{}'.format(GIG_RUNNER_DIR, stage.name) %}
set -x
{{ stage.command % STAGE_SCRIPT }}
set +x
{%- else %}
function {{ gig_run.name }}() {
    set -x
    {{ stage.script }}
    set +x
}
{{ gig_run.name }}
{%- endif %}

if [[ '{{ stage.type }}' == 'Input' ]]
then
    kubectl patch {{ gig_run.name }}

    kubectl wait gigrun/{{ gig_run.name }} \
        --timeout=600s --for=jsonpath='{.status.state}'='WaitingForUserInput' -n {{ gig_run.namespace }} &> /dev/null

    echo
    echo 'Waiting for user input...'
    kubectl wait gigrun/{{ gig_run.name }} --timeout=600s --for=jsonpath='{.status.state}'='Running' -n {{ gig_run.namespace }} &> /dev/null
    echo
    echo 'User input recieved; continuing...'
fi

echo
echo "==> STAGE COMPLETED: {{ stage.name }}"
{%- endfor %}