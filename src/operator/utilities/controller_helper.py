import os
from copy import deepcopy
import yaml

from box import Box, BoxList

from jinja2 import Environment, FileSystemLoader

import kopf
from kr8s.objects import CronJob, Job, Secret

from utilities.gig_types import GIG_CONSTS, GigDefinition, GigRun

GIG_RUNNER = 'gigrunner'
GIG_RUNNER_HOME = f'/{GIG_RUNNER}'
GIG_RUNNER_SH = f'{GIG_RUNNER}.sh'
WORK_DIR = 'workDir'
GIG_RUNNER_WORKING_DIR = f'/{WORK_DIR}'


RUNNER_DIR = 'runner'
RUNNER_TEMPLATES_DIR = 'templates'
SECRET_JINJA_TEMPLATE = 'gigrunner-secret.j2'

def create_job(cron_job: CronJob, gig_run: GigRun, gig_def: GigDefinition, secret_name: str) -> Job:
    spec = deepcopy(cron_job.spec.jobTemplate)
    job = Job(spec)
    job.metadata.name = None
    job.metadata.generateName = f'{gig_run.name}-'
    job.namespace = gig_run.metadata.namespace
    job.spec.template.spec[GIG_CONSTS.RESTART_POLICY] = GIG_CONSTS.NEVER
    job.spec[GIG_CONSTS.BACKOFF_LIMIT] = 0

    container = get_container(job, cron_job.annotations.get(GigRun.CONTAINER_NAME_ANNOTATION))
    configure_container(job, container, gig_run.name, secret_name, gig_def.workDirSizeLimit)

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

def configure_container(job: Job, container: Box, gig_run_name: str, secret_name: str, working_dir_size_limit):
    secret_volume = Box(name = secret_name, secret = Box(secretName = secret_name, defaultMode = 0o777))
    job.spec.template.spec.setdefault(GIG_CONSTS.VOLUMES, BoxList()).append(secret_volume)

    secret_volume_mount = Box(name = secret_name, mountPath = f'/{GIG_RUNNER}')
    container.setdefault(GIG_CONSTS.VOLUME_MOUNTS, BoxList()).append(secret_volume_mount)

    container['imagePullPolicy'] = 'Always'

    env = BoxList()
    env.append(Box(name = 'GIG_RUNNER_HOME', value = GIG_RUNNER_HOME))
    env.append(Box(name = 'GIG_RUNNER_WORKING_DIR', value = GIG_RUNNER_WORKING_DIR))
    env.append(Box(name = 'GIG_RUN_NAME', value = gig_run_name))
    env.append(Box(name = 'POD_NAME', valueFrom = Box(fieldRef = Box(fieldPath = f'{GIG_CONSTS.METADATA}.{GIG_CONSTS.NAME}'))))
    env.append(Box(name = 'GIG_RUN_NAMESPACE', valueFrom = Box(fieldRef = Box(fieldPath = f'{GIG_CONSTS.METADATA}.{GIG_CONSTS.NAMESPACE}'))))
    env.append(Box(name = 'POD_NAMESPACE', valueFrom = Box(fieldRef = Box(fieldPath = f'{GIG_CONSTS.METADATA}.{GIG_CONSTS.NAMESPACE}'))))
    container.setdefault(GIG_CONSTS.ENV, env)

    set_job_working_dir(container, job, working_dir_size_limit)

    container.command = BoxList(['bash', '-ce'])
    container.args = BoxList([f'{GIG_RUNNER_HOME}/{GIG_RUNNER_SH}'])

def set_job_working_dir(container: Box, job: Job, working_dir_size_limit):
    volumes = job.spec.template.spec.setdefault(GIG_CONSTS.VOLUMES, BoxList())
    if (not list(filter(lambda vol: vol[GIG_CONSTS.NAME] == WORK_DIR, volumes))):
        working_dir_volume = Box(name = WORK_DIR.lower(), emptyDir = Box(sizeLimit = working_dir_size_limit))
        volumes.append(working_dir_volume)

        working_dir_volumemount = Box(name = WORK_DIR.lower(), mountPath = GIG_RUNNER_WORKING_DIR)
        container.volumeMounts.append(working_dir_volumemount)
        container.workDir = GIG_RUNNER_WORKING_DIR

def collect_secret_vars(gig_def: GigDefinition, namespace: str) -> list:
    secrets = []
    for secret in gig_def.secrets:
        k8s_secret = Secret.get(secret[GIG_CONSTS.NAME], namespace)
        secrets += k8s_secret.data.keys()

    for secretEnvVar in gig_def.secretEnvVars:
        secrets.append(secretEnvVar)

    return secrets

def create_gigrunner_secret(gig_run: GigRun, gig_def: GigDefinition, namespace: str) -> Secret:
    env = Environment(loader = FileSystemLoader([RUNNER_DIR, f'{RUNNER_DIR}/{RUNNER_TEMPLATES_DIR}']))

    secret_vars = collect_secret_vars(gig_def, namespace)
    secret_vars = '\n'.join([f'{key_var}' for key_var in secret_vars])
    secret_files = [file for file in os.listdir(f'{RUNNER_DIR}/{RUNNER_TEMPLATES_DIR}')]
    template_data = {
        'gig_def': gig_def,
        'gig_run': gig_run,
        'K8S_SECRET_NAME': gig_run.name,
        'SECRET_VARS': secret_vars,
        'GIG_TIMEOUT': gig_def.activeDeadlineSeconds,
        'SECRET_FILES': secret_files,
    }

    for file in secret_files:
        template = env.get_template(file)
        output = template.render(template_data)

    template = env.get_template(SECRET_JINJA_TEMPLATE)
    output = template.render(template_data)

    secret = Secret(yaml.safe_load(output))
    secret.create()
    secret.set_owner(gig_run)

    return secret

def get_name_namespace_from_anno(annotation_val):
    ref = annotation_val.split('/')
    name = ref[0] if len(ref) == 1 else ref[1]
    namespace = '' if len(ref) == 1 else ref[0]
    return Box(name = name, namespace = namespace)