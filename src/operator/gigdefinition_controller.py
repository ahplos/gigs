import os
import yaml

from jinja2 import Environment, FileSystemLoader

import kopf

from kr8s.objects import ConfigMap, Secret

from utilities.gig_types import GigDefinition
from utilities.constants import GIG_CONSTS

RUNNER_DIR = 'runner'
RUNNER_TEMPLATES_DIR = 'templates'

STAGERUNNER_SECRET_TEMPLATE = 'stagerunner-secret.j2'

COMMAND = 'command'

@kopf.on.update(GigDefinition.version, GigDefinition.plural)  # type: ignore
@kopf.on.create(GigDefinition.version, GigDefinition.plural)  # type: ignore
def on_create_or_update_gigdefinition(body, logger, **_):
    gig_def: GigDefinition = GigDefinition(body)

    stage_processors = ConfigMap.get(os.environ['TEKNETES_GIGS_PROCESSOR_MAP'],
                                     os.environ['TEKNETES_GIGS_OPERATOR_NAMESPACE'])

    for stage in gig_def.stages:
        if (not stage.get(COMMAND, None)):
            command = stage_processors.data.get(stage.scriptType, None)
            command = command if command else stage_processors.data.get(GIG_CONSTS.SHELL)
            if (command):
                stage.command = command

    env = Environment(loader = FileSystemLoader([RUNNER_DIR, f'{RUNNER_DIR}/{RUNNER_TEMPLATES_DIR}']))
    template_data = {
        'gig_def': gig_def
    }

    template = env.get_template(STAGERUNNER_SECRET_TEMPLATE)
    output = template.render(template_data)

    secret = Secret(yaml.safe_load(output))
    if (secret.exists()):
        secret.patch(secret.to_dict(), type='merge')
    else:
        secret.create()

    secret.set_owner(gig_def)
    gig_def.set_owner(secret)