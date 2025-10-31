import os
import yaml

from jinja2 import Environment, FileSystemLoader

import kopf

from kr8s.objects import ConfigMap, Secret

from utilities.gig_types import GigModule

RUNNER_DIR = 'runner'
RUNNER_TEMPLATES_DIR = 'templates'

GIG_MOD_SECRET_TEMPLATE = 'gigmodule-secret.j2'

COMMAND = 'command'

@kopf.on.update(GigModule.version, GigModule.plural)  # type: ignore
@kopf.on.create(GigModule.version, GigModule.plural)  # type: ignore
def on_create_or_update_gigmodule(body, logger, **_):
    gig_mod: GigModule = GigModule(body)

    step_interpreters = ConfigMap.get(os.environ['AHPLOS_GIGS_INTERPRETER_MAP'], os.environ['AHPLOS_GIGS_OPERATOR_NAMESPACE'])

    for stage in gig_mod.spec.stages: # type: ignore
        if (not stage.stageRef):
            for step in stage.steps:
                if (not step.stepRef and step.interpreter != 'Custom'):
                    step.interpreter = step.interpreter if step.interpreter else 'Shell'
                    step.command = step_interpreters.data[step.interpreter]

    env = Environment(loader = FileSystemLoader([RUNNER_DIR, f'{RUNNER_DIR}/{RUNNER_TEMPLATES_DIR}']))
    template_data = {
        'gig_mod': gig_mod,
    }

    template = env.get_template(GIG_MOD_SECRET_TEMPLATE)
    output = template.render(template_data)
    logger.debug(f'{output}')

    secret = Secret(yaml.safe_load(output))
    if (secret.exists()):
        secret.patch({'stringData': secret.raw.stringData.to_dict()}, type='merge')
    else:
        secret.create()

    secret.set_owner(gig_mod)
    gig_mod.set_owner(secret)