import os
import logging
import random
from typing import AsyncIterator

import kopf
from kr8s.objects import CronJob
from gig_types import GigRun, GigDefinition, Gig

class ServiceTunnel:
    URL = 'url'
    SERVICE = 'service'

    SVC = 'svc'

    def __init__(self):
        self.logger = logging.getLogger()

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
    settings.admission.managed = 'auto.kopf.dev'

    # sensible number of workers so as to not overload the k8s API server
    settings.batching.worker_limit = 3

    # all logs by default go to the k8s event api making api server flooding even more likely
    settings.posting.enabled = False
    settings.posting.level = logging.WARNING

GIG_DEFINITION_ANNOTATION = 'batch.tenknetes.org/gigdefinition'
CONTAINER_NAME_ANNOTATION = 'batch.tenknetes.org/containername'

@kopf.on.mutate('batch/v1', 'cronjobs', annotations={GIG_DEFINITION_ANNOTATION: kopf.PRESENT}) # type: ignore
def onmutatecronjob(patch, annotations, logger, **_):
    jobAnnotations = patch.spec.setdefault('jobTemplate', {}).setdefault('metadata', {}).setdefault('annotations', {})
    jobAnnotations[GIG_DEFINITION_ANNOTATION] = annotations[GIG_DEFINITION_ANNOTATION]

@kopf.on.validate(CronJob.version, CronJob.singular, annotations={GIG_DEFINITION_ANNOTATION: kopf.PRESENT}) # type: ignore
def onvalidatecronjob(annotations, meta, **_):
    gigDef = GigDefinition(annotations[GIG_DEFINITION_ANNOTATION])
    if (not gigDef.exists()):
        raise kopf.AdmissionError(f'The GigDefinition for the batch.tenknetes.org/gig-definition annotation in CronJob {meta.name} does not exist.', code=499)

@kopf.on.create(CronJob.version, CronJob.singular, annotations={GIG_DEFINITION_ANNOTATION: kopf.PRESENT}) # type: ignore
def onCreateCronJob(body, logger, **_):
    gig = Gig(body.metadata.name, namespace=body.metadata.namespace)
    gig.cronJobRef = body.metadata.name
    gig.gigDefinitionRef = body.metadata.annotations[GIG_DEFINITION_ANNOTATION]
    kopf.adopt(gig.to_dict())
    logger.error(f'GIG: {gig.to_dict()}')
    gig.create()

@kopf.on.update(CronJob.version, CronJob.singular, annotations={GIG_DEFINITION_ANNOTATION: kopf.PRESENT}) # type: ignore
def onUpdateCronJob(old, new, **_):
    if (new.metadata.annotations[GIG_DEFINITION_ANNOTATION] != old.metadata.annotations[GIG_DEFINITION_ANNOTATION]):
        gig = Gig.get(new.name, new.namespace)
        gigDefinitionRef = new.metadata.annotations[GIG_DEFINITION_ANNOTATION]
        gig.patch({'spec': { 'gigDefinitionRef': gigDefinitionRef }})