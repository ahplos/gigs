#!/usr/bin/bash

{%- for stage in gig_def.stages %}
/{{ GIG_RUNNER }}/stage_banner.sh '{{ stage.name }}' '{{ stage.processor }}' '{{ stage.description }}'

{%- if 'command' in stage %}
{%- set STAGE_SCRIPT = stage.command % '/{}/{}'.format(GIG_RUNNER, stage.name) %}
{%- else %}
{% set FUNC_NAME = stage.name.replace('-', '_').replace('.', '_') %}
function {{ FUNC_NAME }}() {
    set -x
    {{ stage.script }}
    set +x
}
{%- set STAGE_SCRIPT = FUNC_NAME %}
{%- endif %}

{%- if stage.secretVars %}
{% set STAGE_SECRET_VARS = '\n'.join(stage.secretVars) %}
echo {{ STAGE_SECRET_VARS }} >> .secrets
{%- endif %}

loadStageEnv
{{ STAGE_SCRIPT }}

if [[ '{{ stage.type }}' == 'Input' ]]
then
    waitForUserInput
fi

echo
echo "==> STAGE COMPLETED: {{ stage.name }}"
echo
{%- endfor %}