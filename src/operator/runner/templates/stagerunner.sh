#!/usr/bin/bash
mkdir .secrets
stageRunner() {
    {%- for stage in gig_def.stages %}
    {% set HAS_SECRETS = 'TRUE' if stage.secretVars else '' %}
    /{{ GIG_RUNNER }}/stage_banner.sh '{{ stage.name }}' '{{ stage.processor }}' '{{ stage.description }}' {{ HAS_SECRETS }}

    loadStageEnv
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

    loadStageEnv
    {%- if stage.secretVars %}
    {% for secretVar in stage.secretVars %}
    echo "${ {{- secretVar }}}" >> .secrets/{{ secretVar }}
    {%- endfor %}
    {%- endif %}

    stage_footer {{ stage.name }} {{ stage.type }}
    {%- endfor %}
}

stageRunner 2>&1 | filterLogOutput > gig.log