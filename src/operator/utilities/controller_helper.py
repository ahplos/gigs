import os
from copy import deepcopy

import kopf
import yaml
from box import Box, BoxList
from jinja2 import Environment, FileSystemLoader
from kr8s.objects import ConfigMap, CronJob, Job, Secret
from utilities.gig_types import GIG_CONSTS, GigDefinition, GigRun

GIG_RUNNER = 'gigrunner'
GIG_RUNNER_HOME = f'/{GIG_RUNNER}'
GIG_RUNNER_SH = f'{GIG_RUNNER}.sh'
WORKING_DIR = 'working-dir'
GIG_RUNNER_WORKING_DIR = f'/{WORKING_DIR}'


RUNNER_DIR = 'runner'
RUNNER_TEMPLATES_DIR = 'templates'
CONFIG_MAP_JINJA_TEMPLATE = 'configMap.j2'

def create_job(cron_job: CronJob, gig_run: GigRun, config_map_name: str) -> Job:
    spec = deepcopy(cron_job.spec.jobTemplate)
    job = Job(spec)
    job.metadata.name = None
    job.metadata.generateName = f'{gig_run.name}-'
    job.namespace = gig_run.metadata.namespace
    job.spec.template.spec[GIG_CONSTS.RESTART_POLICY] = GIG_CONSTS.NEVER
    job.spec[GIG_CONSTS.BACKOFF_LIMIT] = 0

    container = get_container(job, cron_job.annotations.get(GigRun.CONTAINER_NAME_ANNOTATION))
    configure_container(job, container, gig_run.name, config_map_name)

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

def configure_container(job: Job, container: Box, gig_run_name: str, config_map_name: str):
    configmap_volume = Box(name = config_map_name, configMap = Box(name = config_map_name, defaultMode = 0o777))
    job.spec.template.spec.setdefault('volumes', BoxList()).append(configmap_volume)

    configmap_volume_mount = Box(name = config_map_name, mountPath = f'/{GIG_RUNNER}')
    container.setdefault('volumeMounts', BoxList()).append(configmap_volume_mount)

    container['imagePullPolicy'] = 'Always'

    env = BoxList()
    env.append(Box(name = 'GIG_RUNNER_HOME', value = GIG_RUNNER_HOME))
    env.append(Box(name = 'GIG_RUNNER_WORKING_DIR', value = GIG_RUNNER_WORKING_DIR))
    env.append(Box(name = 'GIG_RUN_NAME', value = gig_run_name))
    env.append(Box(name = 'POD_NAME', valueFrom = Box(fieldRef = Box(fieldPath = f'{GIG_CONSTS.METADATA}.{GIG_CONSTS.NAME}'))))
    env.append(Box(name = 'POD_NAMESPACE', valueFrom = Box(fieldRef = Box(fieldPath = f'{GIG_CONSTS.METADATA}.{GIG_CONSTS.NAMESPACE}'))))
    container.setdefault(GIG_CONSTS.ENV, env)

    set_job_working_dir(container, job)

    container.command = BoxList(['bash', '-ce'])
    container.args = BoxList([f'{GIG_RUNNER_HOME}/{GIG_RUNNER_SH}'])

def set_job_working_dir(container: Box, job: Job):
    working_dir_volume = Box(name = WORKING_DIR, emptyDir = Box(sizeLimit = '10Mi'))
    job.spec.template.spec.volumes.append(working_dir_volume)

    working_dir_volumemount = Box(name = WORKING_DIR, mountPath = GIG_RUNNER_WORKING_DIR)
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

def create_gigrun_configmap(gig_run: GigRun, gig_def: GigDefinition, namespace: str) -> ConfigMap:
    env = Environment(loader = FileSystemLoader([RUNNER_DIR, f'{RUNNER_DIR}/{RUNNER_TEMPLATES_DIR}']))

    secret_vars = collect_secret_vars(gig_def, namespace)
    secret_vars = '\n'.join([f'{key_var}' for key_var in secret_vars])
    configMapFiles = [file for file in os.listdir(f'{RUNNER_DIR}/{RUNNER_TEMPLATES_DIR}')]
    template_data = {
        'gig_def': gig_def,
        'gig_run': gig_run,
        'K8S_SECRET_NAME': gig_run.name,
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
    config_map.set_owner(gig_run)

    return config_map