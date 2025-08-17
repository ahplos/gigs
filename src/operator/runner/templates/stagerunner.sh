#!/usr/bin/bash -e
mkdir .secrets

COUNTER=0
__stageRunner() {
    __saveInputParamsToEnv

    ${GIG_RUNNER_HOME}/gigrun_header.sh

    {%- for stage in gig_def.stages %}
    {% set HAS_SECRETS = 'TRUE' if stage.secretVars else '' %}
    ${GIG_RUNNER_HOME}/stage_header.sh $((++COUNTER)) '{{ stage.name }}' '{{ stage.processor }}' '{{ stage.description }}' {{ HAS_SECRETS }}

    __loadStageEnv
    {%- if 'command' in stage %}
    {%- set STAGE_SCRIPT = stage.command % '/{}/{}'.format(GIG_RUNNER, stage.name) %}
    {% filter indent(width=4) %}
    {{- STAGE_SCRIPT }}
    {%- endfilter %}
    {%- else %}
    {% set FUNC_NAME = stage.name.replace('-', '_').replace('.', '_') %}
    {% if not stage.secretVars %}
    set -x
    {%- endif %}
    {% filter indent(width=4) %}
    {{- stage.script }}
    {%- endfilter %}
    { set +x; } 2>/dev/null
    {%- endif %}

    __loadStageEnv
    {%- if stage.secretVars %}
    {% for secretVar in stage.secretVars %}
    echo "${ {{- secretVar }}}" >> .secrets/{{ secretVar }}
    {%- endfor %}
    {%- endif %}


    __end_stage {{ stage.name }} {{ stage.processor }}
    {%- endfor %}
}

__stageRunner 2>&1 | __filterLogOutput > gig.log
echo ${PIPESTATUS[0]} > .stagerunner_exit_status