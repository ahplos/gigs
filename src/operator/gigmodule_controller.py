import yaml
import re
import base64
import subprocess

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
    gigmod: GigModule = GigModule(body)
    if (gigmod.spec.gigFormRef and not gigmod.spec.gigFormRef.namespace):
        patch.setdefault(GIG_CONSTS.SPEC, {})[GIG_CONSTS.GIG_FORM_REF] = {
            GIG_CONSTS.NAME: gigmod.spec.gigFormRef.name,
            GIG_CONSTS.NAMESPACE: gigmod.metadata.namespace,
        }

@kopf.on.update(GigModule.version, GigModule.plural)  # type: ignore
@kopf.on.create(GigModule.version, GigModule.plural)  # type: ignore
def on_create_or_update_gigmodule(body, logger, **_):
    gigmod: GigModule = GigModule(body)

    template_data = {
        'gigmod': gigmod,
        'GIGRUN_HOME': GIG_CONSTS.GIGRUN_HOME,
        'GIGMOD_DIR_NAME': f'{gigmod.namespace}_{gigmod.name}'
    }

    template = JINJA_ENV.get_template(GIGMOD_SECRET_TEMPLATE)
    output = template.render(template_data)
    logger.debug(f'{output}')

    secret = Secret(yaml.safe_load(output))
    secret_exists = secret.exists()
    stringData = 'stringData'
    for shell_file in secret[stringData]:
        if (not shell_file.endswith('__when.js') and re.match(r"gigrunner|stagerunner", shell_file)):
            try:
                result = subprocess.run(
                    ['shfmt', '-i', '4', '-'],
                    input=secret[stringData][shell_file],
                    capture_output=True,
                    text=True,
                    check=True
                )
                logger.debug(f'FORMATTED: {shell_file}')
                secret.raw.stringData[shell_file] = result.stdout

            except subprocess.CalledProcessError as e:
                raise Exception(f'Error[{e.returncode}]: {e.stderr}\nOriginal[{shell_file}]:\n{secret[stringData][shell_file]}')

        if (secret_exists):
            bytes_data = secret.raw.stringData[shell_file].encode('utf-8')
            encoded_bytes = base64.b64encode(bytes_data)
            encoded_bytes = encoded_bytes.decode('utf-8')
            secret.raw.setdefault('data', {})[shell_file] = encoded_bytes

    if (secret.exists()):
        patch_data = [{"op": "replace", "path": "/data", "value": secret.data.to_dict()}]
        secret.patch(patch_data, type='json')
    else:
        secret.create()

    secret.set_owner(gigmod)
    gigmod.set_owner(secret)