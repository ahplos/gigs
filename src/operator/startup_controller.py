import os
import logging
import random
import yaml
import base64
from typing import AsyncIterator

from jinja2 import Environment, FileSystemLoader

import kopf
from kr8s.objects import Secret

RUNNER_DIR = 'runner'
GIGRUN_FILES_DIR = 'gigrun-files'
GIGRUN_FILES_SECRET_TEMPLATE = 'gigrun-files-secret.j2'

class ahplosGigsOperator:
    URL = 'url'
    SERVICE = 'service'

    SVC = 'svc'

    def __init__(self):
        self.logger = logging.getLogger()
        self.logger.setLevel(logging.INFO)

        self.namespace = os.environ['AHPLOS_GIGS_OPERATOR_NAMESPACE']
        self.name = os.environ['AHPLOS_GIGS_OPERATOR_NAME']
        self.host = f'{self.name}.{self.namespace}.{ahplosGigsOperator.SVC}'

        self.service_port = int(os.environ['AHPLOS_GIGS_OPERATOR_PORT'])
        self.container_port = int(os.environ['AHPLOS_GIGS_OPERATOR_PORT'])

        self.cert_path = '/var/run/secrets/kubernetes.io/serviceaccount/ca.crt'

        self.logger.info(f'NAMESPACE: {self.namespace}')
        self.logger.info(f'OPERATOR NAME: {self.name}')
        self.logger.info(f'SERVICE PORT: {self.service_port}')
        self.logger.info(f'CONTAINER PORT: {self.container_port}')
        self.logger.info(f'CERT PATH: {self.cert_path}')
        self.logger.info(f'HOST: {self.host}')

    async def __call__(self, fn: kopf.WebhookFn) -> AsyncIterator[kopf.WebhookClientConfig]:
        server = kopf.WebhookServer(certfile=self.cert_path, port=self.container_port, host=self.host)

        async for client_config in server(fn):
            client_config[ahplosGigsOperator.URL] = None
            client_config[ahplosGigsOperator.SERVICE] = \
                kopf.WebhookClientConfigService(name=self.name,
                                                namespace=self.namespace,
                                                port=self.service_port)
            yield client_config

@kopf.on.startup() # type: ignore
def on_startup(settings: kopf.OperatorSettings, logger, **_):
    settings.watching.connect_timeout = 120
    settings.watching.server_timeout = 600

    settings.peering.priority = random.randint(0, 32767)
    settings.peering.stealth = True
    settings.peering.clusterwide = True

    settings.admission.server = ahplosGigsOperator()
    settings.admission.managed = 'batch.ahplos.gigs'

    # sensible number of workers so as to not overload the k8s API server
    settings.execution.max_workers = 30

    # all logs by default go to the k8s event api making api server flooding even more likely
    settings.posting.enabled = False
    settings.posting.level = logging.INFO

    create_gigrunner_secret()

def create_gigrunner_secret():
    env = Environment(loader = FileSystemLoader([RUNNER_DIR, f'{RUNNER_DIR}/{GIGRUN_FILES_DIR}']))

    secret_files = [file for file in os.listdir(f'{RUNNER_DIR}/{GIGRUN_FILES_DIR}')]

    with open('/var/run/secrets/kubernetes.io/serviceaccount/namespace') as f:
        gigrunner_secret_namespace = f.read().strip()

    template_data = {
        'namespace': gigrunner_secret_namespace,
        'SECRET_FILES': secret_files
    }

    template = env.get_template(GIGRUN_FILES_SECRET_TEMPLATE)
    output = template.render(template_data)

    secret = Secret(yaml.safe_load(output))
    if (secret.exists()):
        for shell_file in secret.raw.stringData:
            bytes_data = secret.raw.stringData[shell_file].encode('utf-8')
            encoded_bytes = base64.b64encode(bytes_data)
            encoded_bytes = encoded_bytes.decode('utf-8')
            secret.raw.setdefault('data', {})[shell_file] = encoded_bytes
        patch_data = [{"op": "replace", "path": "/data", "value": secret.data.to_dict()}]
        secret.patch(patch_data, type='json')
    else:
        secret.create()

    return secret