import yaml
import re
import subprocess

from box import Box

from jinja2 import Environment, FileSystemLoader, FileSystemBytecodeCache

import kopf

from kr8s.objects import Secret

from utilities.gig_types import GigModule
from utilities.constants import GIG_CONSTS

RUNNER_DIR = 'runner'
RUNNER_TEMPLATES_DIR = 'templates'

GIGMOD_SECRET_TEMPLATE = 'gigmodule-secret.j2'

COMMAND = 'command'

JINJA_BCC = FileSystemBytecodeCache(directory='/tmp', pattern='__jinja2_%s.cache')
JINJA_ENV = Environment(
    loader = FileSystemLoader([RUNNER_DIR, f'{RUNNER_DIR}/{RUNNER_TEMPLATES_DIR}']),
    bytecode_cache=JINJA_BCC,
    cache_size=400
)

@kopf.on.mutate(GigModule.version, GigModule.plural, operations=[GIG_CONSTS.CREATE, GIG_CONSTS.UPDATE])  # type: ignore
def onmutategigmodule(userinfo, patch, body, logger, **_):
    gig_mod: GigModule = GigModule(body)
    if (gig_mod.spec.gigFormRef and not gig_mod.spec.gigFormRef.namespace):
        patch.setdefault(GIG_CONSTS.SPEC, {})[GIG_CONSTS.GIG_FORM_REF] = {
            GIG_CONSTS.NAME: gig_mod.spec.gigFormRef.name,
            GIG_CONSTS.NAMESPACE: gig_mod.metadata.namespace,
        }

@kopf.on.update(GigModule.version, GigModule.plural)  # type: ignore
@kopf.on.create(GigModule.version, GigModule.plural)  # type: ignore
def on_create_or_update_gigmodule(body, logger, **_):
    gig_mod: GigModule = GigModule(body)

    template_data = {
        'gig_mod': gig_mod,
        'GIGRUN_HOME': GIG_CONSTS.GIGRUN_HOME,
        'GIGMOD_DIR_NAME': f'{gig_mod.namespace}_{gig_mod.name}'
    }

    template = JINJA_ENV.get_template(GIGMOD_SECRET_TEMPLATE)
    output = template.render(template_data)
    logger.debug(f'{output}')

    secret = yaml.safe_load(output)
    stringData = 'stringData'
    for shell_file in secret[stringData]:
        if (not shell_file.endswith('__when.js') and re.match(r"gigrunner|stagerunner", shell_file)):
            process = subprocess.Popen(
                ['shfmt', '-i', '4', '-'],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )

            stdout, stderr = process.communicate(input=secret[stringData][shell_file])

            if (process.returncode == 0):
                print(f'PROCESSED: {shell_file}')
                secret[stringData][shell_file] = stdout
            else:
                print(f'Error:\n{secret[stringData][shell_file]}')
                raise Exception(f'Error: {stderr}')

    secret = Secret(secret)
    if (secret.exists()):
        secret.patch({'stringData': secret.raw.stringData.to_dict()}, type='merge')
    else:
        secret.create()

    secret.set_owner(gig_mod)
    gig_mod.set_owner(secret)