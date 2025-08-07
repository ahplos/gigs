import os
import logging
import yaml
from copy import deepcopy

from jinja2 import Environment, FileSystemLoader

import kopf

from kr8s.objects import ConfigMap, CronJob, Secret, Job

from box import Box, BoxList

from utilities.gig_types import GigRun, GigDefinition

GIG_DEFINITION_ANNOTATION = 'batch.tenknetes.org/gigdefinition'
CONTAINER_NAME_ANNOTATION = 'batch.tenknetes.org/containername'

USER_INPUT_ANNOTATION = 'batch.tenknetes.org/userinput'

STATUS = 'status'
STATE = 'state'

GIG_RUNNER = 'gigrunner'
GIG_RUNNER_SH = f'{GIG_RUNNER}.sh'

GIG_RUNNER_WORKING_DIR = 'working-dir'

RUNNER_DIR = 'runner'
RUNNER_TEMPLATES_DIR = 'templates'
CONFIG_MAP_JINJA_TEMPLATE = 'configMap.jinja'

def create_job(cron_job: CronJob, gig_run: GigRun) -> Job:
    spec = deepcopy(cron_job.spec.jobTemplate)
    job = Job(spec)
    job.name = gig_run.name
    job.namespace = gig_run.metadata.namespace
    job.spec.template.spec['restartPolicy'] = 'Never'
    job.spec['backoffLimit'] = 0

    container = get_container(job, cron_job.annotations.get(CONTAINER_NAME_ANNOTATION))
    configure_container(gig_run, job, container)

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

def configure_container(gig_run: GigRun, job: Job, container: Box):
    configmap_volume = Box(name = gig_run.name, configMap = Box(name = gig_run.name, defaultMode = 0o777))
    job.spec.template.spec.setdefault('volumes', BoxList()).append(configmap_volume)

    configmap_volume_mount = Box(name = gig_run.name, mountPath = f'/{GIG_RUNNER}')
    container.setdefault('volumeMounts', BoxList()).append(configmap_volume_mount)

    container['imagePullPolicy'] = 'Always'

    set_job_working_dir(container, job)

    container.args = BoxList([f'/{GIG_RUNNER}/{GIG_RUNNER_SH}'])

def set_job_working_dir(container: Box, job: Job):
    working_dir_volume = Box(name = GIG_RUNNER_WORKING_DIR, emptyDir = Box(sizeLimit = '10Mi'))
    job.spec.template.spec.volumes.append(working_dir_volume)

    working_dir_volumemount = Box(name = GIG_RUNNER_WORKING_DIR, mountPath = f'/{GIG_RUNNER_WORKING_DIR}')
    container.volumeMounts.append(working_dir_volumemount)
    container.workingDir = GIG_RUNNER_WORKING_DIR

def collect_secret_vars(gig_def: GigDefinition, namespace: str) -> list:
    secrets = []
    for secret in gig_def.secrets:
        secret_ref = secret.get('secretRef')
        if (secret_ref):
            k8s_secret = Secret.get(secret_ref['name'], namespace)
            if (k8s_secret):
                secrets += k8s_secret.data.keys()
        else:
            secrets.append(secret.envVar)

    return secrets

def create_gigrun_configmap(job: Job, gig_run: GigRun, gig_def: GigDefinition, namespace: str) -> ConfigMap:
    env = Environment(loader = FileSystemLoader([RUNNER_DIR, f'{RUNNER_DIR}/{RUNNER_TEMPLATES_DIR}']))

    secret_vars = collect_secret_vars(gig_def, namespace)
    secret_vars = '\n'.join([f'{key_var}' for key_var in secret_vars])
    configMapFiles = [file for file in os.listdir(f'{RUNNER_DIR}/{RUNNER_TEMPLATES_DIR}')]
    template_data = {
        'GIG_RUNNER': GIG_RUNNER,
        'GIG_RUNNER_WORKING_DIR': GIG_RUNNER_WORKING_DIR,
        'gig_def': gig_def,
        'gig_run': gig_run,
        'SECRET_VARS': secret_vars,
        'configMapFiles': configMapFiles,
    }
    for file in configMapFiles:
        template = env.get_template(file)
        output = template.render(template_data)

    template = env.get_template(CONFIG_MAP_JINJA_TEMPLATE)
    output = template.render(template_data)

    config_map = ConfigMap(yaml.safe_load(output))
    config_map.create()
    config_map.set_owner(job)

    return config_map