import os
import logging
import random
import textwrap
from typing import AsyncIterator
from copy import deepcopy

from box import Box, BoxList

import kopf
from kr8s.objects import CronJob, ConfigMap, Job
from gig_types import GigRun, GigDefinition, Gig

from collections.abc import Mapping

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
    settings.admission.managed = 'auto.kopf.dev'

    # sensible number of workers so as to not overload the k8s API server
    settings.batching.worker_limit = 3

    # all logs by default go to the k8s event api making api server flooding even more likely
    settings.posting.enabled = False
    settings.posting.level = logging.WARNING

GIG_DEFINITION_ANNOTATION = 'batch.tenknetes.org/gigdefinition'
CONTAINER_NAME_ANNOTATION = 'batch.tenknetes.org/containername'
WORKING_DIR_NAME_ANNOTATION = 'batch.tenknetes.org/workingdirname'

@kopf.on.mutate(CronJob.version, CronJob.plural, annotations={GIG_DEFINITION_ANNOTATION: kopf.PRESENT}) # type: ignore
def onmutatecronjob(patch, meta, annotations, logger, **_):
    if (not CronJob(meta.name, meta.namespace).exists()):
        logger.info(f'ANNOTATING jobTemplate in CronJob: {meta.namespace}:{meta.name}')
        jobAnnotations = patch.spec.setdefault('jobTemplate', {}).setdefault('metadata', {}).setdefault('annotations', {})
        jobAnnotations[GIG_DEFINITION_ANNOTATION] = annotations[GIG_DEFINITION_ANNOTATION]
    else:
        logger.info(f'CronJob exist; skipping jobTemplate annotation: {meta.namespace}:{meta.name}')

@kopf.on.validate(CronJob.version, CronJob.plural, annotations={GIG_DEFINITION_ANNOTATION: kopf.PRESENT}) # type: ignore
def onvalidatecronjob(annotations, meta, **_):
    gigDef = GigDefinition(annotations[GIG_DEFINITION_ANNOTATION])
    if (not gigDef.exists()):
        raise kopf.AdmissionError(f'The GigDefinition for the batch.tenknetes.org/gig-definition annotation in CronJob {meta.name} does not exist.', code=499)

@kopf.on.create(CronJob.version, CronJob.plural, annotations={GIG_DEFINITION_ANNOTATION: kopf.PRESENT}) # type: ignore
def on_create_cronjob(body, meta, logger, **_):
    gig = Gig(meta.name, namespace=meta.namespace)
    gig.cronJobRef = meta.name
    gig.gigDefinitionRef = meta.annotations[GIG_DEFINITION_ANNOTATION]
    logger.info(f'NEW GIG CREATED: {gig.to_dict()}')
    gig.create()
    gig.set_owner(CronJob(body))

@kopf.on.update(CronJob.version, CronJob.plural, annotations={GIG_DEFINITION_ANNOTATION: kopf.PRESENT}) # type: ignore
def on_update_cronjob(old, new, logger, **_):
    if (new.metadata.annotations[GIG_DEFINITION_ANNOTATION] != old.metadata.annotations[GIG_DEFINITION_ANNOTATION]):
        gig = Gig.get(new.name, new.namespace)
        oldGigDef = old.metadata.annotations[GIG_DEFINITION_ANNOTATION]
        newGigDef = new.metadata.annotations[GIG_DEFINITION_ANNOTATION]
        logger.info(f'MODIFIED: GIG {gig.name} FROM {oldGigDef} TO {newGigDef} GigDefinition')
        gig.patch({'spec': { 'gigDefinitionRef': newGigDef }})

@kopf.on.create(GigRun.version, GigRun.plural) # type: ignore
def on_create_gigrun(meta, **_):
    gig_run = GigRun.get(meta.name, meta.namespace)
    gig = Gig.get(gig_run.gigRef, meta.namespace)
    cron_job = CronJob.get(gig.name, gig.namespace)
    gig_def = GigDefinition.get(gig.gigDefinitionRef)

    job = create_job(cron_job, gig_run)
    gig_run.set_owner(job)

    config_map = create_gigrun_configmap(job, gig_run, gig_def)

@kopf.on.update(GigRun.version, GigRun.plural) # type: ignore
def on_update_gigrun(old, new, logger, **_):
    pass

def create_gigrun_configmap(job: Job, gig_run: GigRun, gig_def: GigDefinition) -> ConfigMap:
    config_map = ConfigMap(gig_run.name, namespace=gig_run.namespace)

    script: str = ''
    script = 'touch .env'
    for stage in gig_def.stages:
        stage_command = stage.command.format(stage.name) if stage.command else ''
        script += f"""
            source .env

            stage_log.sh '{stage.name}' "${{STAGE_DESCRIPTION}}"

            {stage_command if stage_command else stage.script}

            kubectl wait gigrun/{gig_run.name} --for=jsonpath='{{.status.phase}}'='RUNNING' -n {gig_run.namespace}
        """

        if (stage_command):config_map.data[stage.name] = stage.script
    config_map.raw.setdefault('data', {})['script'] = script
    with open('./resources/stage_log.sh') as stage_log_script:
        config_map.data['stage_log.sh'] = stage_log_script.read()
    config_map.create()
    config_map.set_owner(job)

    return config_map

def create_job(cron_job: CronJob, gig_run: GigRun) -> Job:
    spec = deepcopy(cron_job.spec.jobTemplate)
    job = Job(spec)
    job.name = gig_run.name

    configmap_volume = Box(name = gig_run.name, configMap = Box(name = gig_run.name))
    job.spec.template.spec.setdefault('volumes', BoxList()).append(configmap_volume)

    configmap_volume_mount = Box(name = gig_run.name, mountPath = f'/{GigRun.singular}')
    job.spec.template.spec.containers[0].setdefault('volumeMounts', BoxList()).append(configmap_volume_mount)

    set_job_working_dir(job, cron_job)

    job.spec.template.spec.containers[0].args = BoxList(
        ['''
         echo howdy
         ''']
    )

    job.create()
    job.set_owner(cron_job)

    return job

def set_job_working_dir(job: Job, cron_job: CronJob):
    working_dir = cron_job.annotations.get(WORKING_DIR_NAME_ANNOTATION)
    if (working_dir):
        for workingDir in job.spec.template.spec.containers[0].volumeMounts:
            if (workingDir.name == working_dir):
                job.spec.template.spec.containers[0].workingDir = workingDir.mountPath
                break
        if (not job.spec.template.spec.containers[0].get('workingDir')):
            msg = f'volumeMount NOT FOUND -> {WORKING_DIR_NAME_ANNOTATION}: {working_dir}'
            logging.error(msg)
            raise kopf.PermanentError(msg)
    else:
        working_dir = 'working-dir'
        working_dir_volume = Box(name = working_dir, emptyDir = Box(sizeLimit = '10Mi'))
        job.spec.template.spec.volumes.append(working_dir_volume)

        working_dir_volumemount = Box(name = working_dir, mountPath = f'/{working_dir}')
        job.spec.template.spec.containers[0].volumeMounts.append(working_dir_volumemount)
        job.spec.template.spec.containers[0].workingDir = working_dir