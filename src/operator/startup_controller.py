import os
import logging
import random
from typing import AsyncIterator, Any

import kopf

import kr8s

class ahplosGigsOperator(kopf.WebhookServer):
    URL = 'url'
    SERVICE = 'service'

    SVC = 'svc'

    def __init__(self):
        self.logger = logging.getLogger()
        self.logger.setLevel(logging.INFO)

        self.namespace = os.environ['GIGS_OPERATOR_NAMESPACE']
        self.name = os.environ['GIGS_OPERATOR_NAME']
        self.host = f'{self.name}.{self.namespace}.{ahplosGigsOperator.SVC}'

        self.service_port = int(os.environ['GIGS_OPERATOR_PORT'])
        self.container_port = int(os.environ['GIGS_OPERATOR_PORT'])

        self.cert_path = '/var/run/secrets/kubernetes.io/serviceaccount/ca.crt'
        super().__init__(certfile=self.cert_path, port=self.container_port, host=self.host)

        self.logger.info(f'NAMESPACE: {self.namespace}')
        self.logger.info(f'OPERATOR NAME: {self.name}')
        self.logger.info(f'SERVICE PORT: {self.service_port}')
        self.logger.info(f'CONTAINER PORT: {self.container_port}')
        self.logger.info(f'CERT PATH: {self.cert_path}')
        self.logger.info(f'HOST: {self.host}')

    async def __aexit__(self, *_: Any) -> None:
        self.logger.info("Operator is shutting down. Performing custom cleanup...")
        next(kr8s.get('MutatingWebhookConfiguration', 'batch.ahplos.gigs')).delete()
        next(kr8s.get('ValidatingWebhookConfiguration', 'batch.ahplos.gigs')).delete()
        await super().__aexit__(*_)

    async def __call__(self, fn: kopf.WebhookFn) -> AsyncIterator[kopf.WebhookClientConfig]:
        async for client_config in super().__call__(fn):
            client_config[ahplosGigsOperator.URL] = None
            client_config[ahplosGigsOperator.SERVICE] = \
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

    settings.admission.server = ahplosGigsOperator()
    settings.admission.managed = 'batch.ahplos.gigs'

    # sensible number of workers so as to not overload the k8s API server
    settings.execution.max_workers = 30

    # all logs by default go to the k8s event api making api server flooding even more likely
    settings.posting.enabled = False
    settings.posting.level = logging.INFO