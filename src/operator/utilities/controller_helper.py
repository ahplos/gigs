from copy import deepcopy
import logging
import yaml

from jinja2 import Environment, FileSystemLoader

import kopf

from kr8s.objects import CronJob, ConfigMap, Job

from box import Box, BoxList

from utilities.gig_types import GigRun, GigDefinition

GIG_DEFINITION_ANNOTATION = 'batch.tenknetes.org/gigdefinition'
CONTAINER_NAME_ANNOTATION = 'batch.tenknetes.org/containername'
WORKING_DIR_NAME_ANNOTATION = 'batch.tenknetes.org/workingdirname'

GIG_DEFINITION_ANNOTATION = 'batch.tenknetes.org/gigdefinition'
WORKING_DIR_NAME_ANNOTATION = 'batch.tenknetes.org/workingdirname'

STATUS = 'status'
STATE = 'state'

GIG_RUN_DIR = f'{GigRun.singular}'
GIG_RUN_SH = f'{GigRun.singular}-controller.sh'

def create_job(cron_job: CronJob, gig_run: GigRun) -> Job:
    spec = deepcopy(cron_job.spec.jobTemplate)
    job = Job(spec)
    job.name = gig_run.name
    job.namespace = gig_run.metadata.namespace
    job.spec.template.spec['restartPolicy'] = 'Never'
    job.spec['backoffLimit'] = 0

    container = get_container(job, cron_job.annotations.get(CONTAINER_NAME_ANNOTATION))
    configure_container(gig_run, cron_job, job, container)

    job.create()
    job.set_owner(cron_job)

    return job

def get_container(job: Job, name = None) -> Box:
    containers = job.spec.template.spec.containers

    if (name):
        containers = list(filter(lambda c: c.name == name, containers))

        if (not containers):
            raise kopf.PermanentError(f'Container NOT FOUND: {name}')

    return containers[0]

def configure_container(gig_run: GigRun, cron_job: CronJob, job: Job, container: Box):
    configmap_volume = Box(name = gig_run.name, configMap = Box(name = gig_run.name, defaultMode = 0o777))
    job.spec.template.spec.setdefault('volumes', BoxList()).append(configmap_volume)

    configmap_volume_mount = Box(name = gig_run.name, mountPath = f'/{GIG_RUN_DIR}')
    container.setdefault('volumeMounts', BoxList()).append(configmap_volume_mount)

    container['imagePullPolicy'] = 'Always'

    working_dir = cron_job.annotations.get(WORKING_DIR_NAME_ANNOTATION)
    set_job_working_dir(container, job, working_dir)

    container.args = BoxList(
        [f'/{GIG_RUN_DIR}/{GIG_RUN_SH}']
    )

    container.args = BoxList([f'/{GIG_RUN_DIR}/{GIG_RUN_SH}'])


def set_job_working_dir(container: Box, job: Job, working_dir: str | None = None):
    if (working_dir):
        for workingDir in container.volumeMounts:
            if (workingDir.name == working_dir):
                container.workingDir = workingDir.mountPath
                break
        if (not container.get('workingDir')):
            msg = f'volumeMount NOT FOUND -> {WORKING_DIR_NAME_ANNOTATION}: {working_dir}'
            raise kopf.PermanentError(msg)
    else:
        working_dir = 'working-dir'
        working_dir_volume = Box(name = working_dir, emptyDir = Box(sizeLimit = '10Mi'))
        job.spec.template.spec.volumes.append(working_dir_volume)

        working_dir_volumemount = Box(name = working_dir, mountPath = f'/{working_dir}')
        container.volumeMounts.append(working_dir_volumemount)
        container.workingDir = working_dir

def create_gigrun_configmap(job: Job, gig_run: GigRun, gig_def: GigDefinition) -> ConfigMap:
    env = Environment(loader = FileSystemLoader('resources'))
    template = env.get_template('configMap.jinja')

    template_data = {
        'GIG_RUN_DIR': GIG_RUN_DIR,
        'GIG_RUN_SH': GIG_RUN_SH,
        'STAGE_LOG_SH': 'stage_log.sh',
        'gig_def': gig_def,
        'gig_run': gig_run,
    }
    output = template.render(template_data)
    config_map = ConfigMap(yaml.safe_load(output))

    config_map.create()
    config_map.set_owner(job)

    return config_map