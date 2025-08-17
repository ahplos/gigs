import os
import logging
import random
from typing import AsyncIterator

import kopf

class ServiceTunnel:
    URL = 'url'
    SERVICE = 'service'

    SVC = 'svc'

    def __init__(self):
        self.logger = logging.getLogger()
        self.logger.setLevel(logging.INFO)

        self.namespace = os.environ['TEKNETES_GIGS_OPERATOR_NAMESPACE']
        self.name = os.environ['TEKNETES_GIGS_OPERATOR_NAME']
        self.host = f'{self.name}.{self.namespace}.{ServiceTunnel.SVC}'

        self.service_port = int(os.environ['TEKNETES_GIGS_OPERATOR_PORT'])
        self.container_port = int(os.environ['TEKNETES_GIGS_OPERATOR_PORT'])

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
            client_config[ServiceTunnel.URL] = None
            client_config[ServiceTunnel.SERVICE] = \
                kopf.WebhookClientConfigService(name=self.name,
                                                namespace=self.namespace,
                                                port=self.service_port)
            yield client_config

@kopf.on.startup() # type: ignore
def on_startup(settings: kopf.OperatorSettings, logger, **_):
    settings.watching.connect_timeout = 60
    settings.watching.server_timeout = 600

    settings.peering.priority = random.randint(0, 32767)
    settings.peering.stealth = True
    settings.peering.clusterwide = True

    settings.admission.server = ServiceTunnel()
    settings.admission.managed = 'batch.teknetes.gigs'

    # sensible number of workers so as to not overload the k8s API server
    settings.batching.worker_limit = 3

    # all logs by default go to the k8s event api making api server flooding even more likely
    settings.posting.enabled = False
    settings.posting.level = logging.INFO