#!/usr/bin/bash -e
mkdir .secrets

COUNTER=0
__stageRunner() {
    ${GIG_RUNNER_HOME}/gigrun_header.sh

    __saveInputParamsToEnv

    {%- for stage in gig_def.stages %}

    __loadStageEnv
    if [[ ! -f ${GIG_RUNNER_HOME}/when-{{ stage.name }}.js || $(node ${GIG_RUNNER_HOME}/when-{{ stage.name }}.js) == 'true' ]]
    then
        {% set HAS_SECRETS = 'HAS_SECRETS' if stage.secretVars else '' %}
        ${GIG_RUNNER_HOME}/stage_header.sh $((++COUNTER)) '{{ stage.name }}' '{{ stage.processor }}' '{{ stage.description }}' {{ HAS_SECRETS }}

        {%- if 'command' in stage %}
        {%- set STAGE_SCRIPT = stage.command % '$GIG_RUNNER_HOME/{}'.format(stage.name) %}
        {% filter indent(width=8) %}
        {{- STAGE_SCRIPT }}
        {%- endfilter %}
        {%- else %}
        {% set FUNC_NAME = stage.name.replace('-', '_').replace('.', '_') %}
        {% if not stage.secretVars %}
        set -x
        {%- endif %}
        {% filter indent(width=8) %}
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


        __endStage {{ stage.name }} {{ stage.processor }}
    else
        ${GIG_RUNNER_HOME}/stage_header.sh $((++COUNTER)) '{{ stage.name }}' '{{ stage.processor }}' '{{ stage.description }}' 'SKIPPED'
    fi

    {%- endfor %}
}

__stageRunner 2>&1 | __filterLogOutput > gig.log
echo ${PIPESTATUS[0]} > .stagerunner_exit_status