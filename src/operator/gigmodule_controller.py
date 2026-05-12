import yaml

from jinja2 import Environment, FileSystemLoader

import kopf

from kr8s.objects import Secret

from utilities.gig_types import GigModule
from utilities.constants import GIG_CONSTS

RUNNER_DIR = 'runner'
RUNNER_TEMPLATES_DIR = 'templates'

GIGMOD_SECRET_TEMPLATE = 'gigmodule-secret.j2'

COMMAND = 'command'

@kopf.on.update(GigModule.version, GigModule.plural)  # type: ignore
@kopf.on.create(GigModule.version, GigModule.plural)  # type: ignore
def on_create_or_update_gigmodule(body, logger, **_):
    gig_mod: GigModule = GigModule(body)

    env = Environment(loader = FileSystemLoader([RUNNER_DIR, f'{RUNNER_DIR}/{RUNNER_TEMPLATES_DIR}']))
    template_data = {
        'gig_mod': gig_mod,
        'GIGRUN_HOME': GIG_CONSTS.GIGRUN_HOME,
        'GIGMOD_DIR_NAME': f'{gig_mod.namespace}_{gig_mod.name}'
    }

    template = env.get_template(GIGMOD_SECRET_TEMPLATE)
    output = template.render(template_data)
    logger.debug(f'{output}')

    secret = Secret(yaml.safe_load(output))
    if (secret.exists()):
        secret.patch({'stringData': secret.raw.stringData.to_dict()}, type='merge')
    else:
        secret.create()

    secret.set_owner(gig_mod)
    gig_mod.set_owner(secret)