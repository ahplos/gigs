import os
import uuid
from copy import deepcopy
import yaml

from box import Box, BoxList

from jinja2 import Environment, FileSystemLoader

import kopf
from kopf import AdmissionError

from kr8s.objects import ConfigMap, CronJob, Job, Secret

from utilities.gig_types import Gig, GigModule, GigRun, GigRunState
from utilities.constants import GIG_CONSTS

DATA = 'data'

STRING_DATA = 'stringData'

GIGMOD_REFS = 'gig_def_refs'

GIGRUN = 'gigrun'
GIG_START_SH = 'gigrun-start.sh'
WORK_DIR = 'workDir'
WORKDIR = f'/{WORK_DIR}'

RUNNER_DIR = 'runner'
GIGRUN_FILES_DIR = 'gigrun-files'
GIGRUN_FILES_SECRET_TEMPLATE = 'gigrun-files-secret.j2'

@kopf.on.mutate(GigRun.version, GigRun.plural, operations=[GIG_CONSTS.CREATE, GIG_CONSTS.UPDATE])  # type: ignore
def onmutategigrun(userinfo, patch, body, logger, **_):
    gig_run = GigRun(body)
    uid = str(gig_run.metadata.annotations.get(GigRun.UUID_ANNOTATION, uuid.uuid4()))
    if (not gig_run.raw.metadata.name):
        patch.metadata[GIG_CONSTS.LABELS] = {
            GIG_CONSTS.GIG_REF_LABEL: gig_run.spec[GIG_CONSTS.GIG_REF][GIG_CONSTS.NAME],
        }

        patch.metadata[GIG_CONSTS.ANNOTATIONS] = {
            GigRun.UUID_ANNOTATION: uid
        }

        patch.setdefault(GIG_CONSTS.SPEC, {})[GIG_CONSTS.STARTED_BY] = userinfo['username']

    if (gig_run.spec.inputValues):
        GIG_CONSTS.GLOBAL_REGISTRY[uid] = gig_run.spec.inputValues

        patch.setdefault(GIG_CONSTS.SPEC, {})[GIG_CONSTS.INPUT_VALUES] = None
        if (gig_run.metadata.name):
            patch[GIG_CONSTS.SPEC][GIG_CONSTS.INPUT_RECEIVED] = True

@kopf.on.validate(GigRun.version, GigRun.plural, operations=[GIG_CONSTS.CREATE, GIG_CONSTS.UPDATE])  # type: ignore
def onvalidategigrun(body, logger, **_):
    gig_run = GigRun(body)
    gig = Gig(gig_run.spec.gigRef.name, gig_run.namespace)
    if (not gig.exists() and not gig_run.metadata.get('deletionTimestamp', None)):
        raise AdmissionError(f'Gig NOT FOUND for GigRun: {gig.namespace}:{gig.name}')

    if (gig_run.spec.inputValues):
        raise AdmissionError(f'GigRun should not be admitted with inputValues: {gig.namespace}:{gig.name}')

@kopf.on.create(GigRun.version, GigRun.plural)  # type: ignore
def on_create_gigrun(body, meta, patch, logger, **_):
    gig_run = GigRun(body)

    gig = Gig.get(gig_run.spec.gigRef.name, gig_run.namespace)
    cron_job = CronJob.get(gig.name, gig.namespace)

    namespace = gig.spec.gigModuleRef.namespace
    namespace = namespace if namespace else gig_run.namespace
    gig_mod = GigModule.get(gig.spec.gigModuleRef.name, namespace)

    gig_def_secrets_map = {}
    secret_key = f'{gig_mod.namespace}_{gig_mod.name}'
    collect_gig_def_secrets(gig_mod, secret_key, gig_def_secrets_map)
    copy_gig_def_secrets_to_gig_run_namespace(gig_def_secrets_map, gig)

    gigrunner_secret = create_gigrunner_secret(gig_run, gig_mod)

    job = create_job(cron_job, gig_run, gig_mod, gigrunner_secret, gig_def_secrets_map)

    create_or_patch_inputValues_secret(gig_run, logger)

    patch.metadata[GIG_CONSTS.LABELS] = {
        GIG_CONSTS.JOB_NAME_SELECTOR_LABEL: job.name,
        GIG_CONSTS.RUN_STATE: GigRunState.RUNNING
    }

def collect_gig_def_secrets(gig_mod: GigModule, secret_key: str, gig_def_secrets_map: dict):
    secret = Secret.get(f'{gig_mod.namespace}.{gig_mod.name}', gig_mod.namespace)
    gig_def_secrets_map[secret_key] =  secret

    for stage in gig_mod.spec.stages:
        if (stage.stageRef):
            name = stage.stageRef.gigModuleRef.name
            namespace = stage.stageRef.gigModuleRef.namespace
            namespace = namespace if namespace else gig_mod.namespace
            secret_key = f'{namespace}_{name}'
            if (secret_key not in gig_def_secrets_map.keys()):
                collect_gig_def_secrets(GigModule.get(name, namespace), secret_key, gig_def_secrets_map)
        else:
            for step in stage.steps:
                if (step.stepRef):
                    name = step.stepRef.gigModuleRef.name
                    namespace = step.stepRef.gigModuleRef.namespace
                    namespace = namespace if namespace else gig_mod.namespace
                    secret_key = f'{namespace}_{name}'
                    if (secret_key not in gig_def_secrets_map.keys()):
                        collect_gig_def_secrets(GigModule.get(name, namespace), secret_key, gig_def_secrets_map)


def copy_gig_def_secrets_to_gig_run_namespace(gig_def_secrets_map: dict, gig: Gig):
    for secret in gig_def_secrets_map.values():
        new_secret = Secret(secret.name, gig.namespace)

        if (new_secret.exists()):
            new_secret.patch({'data': secret.data.to_dict()})
        else:
            new_secret.data = deepcopy(secret.data)
            new_secret.raw.type = secret.raw.type
            new_secret.create()
            new_secret.set_owner(gig)

@kopf.on.update(GigRun.version, GigRun.plural, field='spec.inputReceived', value=True)  # type: ignore
def on_update_gigrun_inputReceived_True(body, patch, logger, **_):
    gig_run = GigRun(body)

    if (gig_run.spec.inputReceived):
        create_or_patch_inputValues_secret(gig_run, logger)

        patch[GIG_CONSTS.SPEC] = {
            GIG_CONSTS.INPUT_RECEIVED: (not gig_run.spec.inputReceived),
            GIG_CONSTS.RUN_STATE: GigRunState.RUNNING
        }

@kopf.on.delete(GigRun.version, GigRun.plural)  # type: ignore
def on_delete_gigrun(body, logger, **_):
    gig_run = GigRun(body)
    job = Job(gig_run.name, gig_run.namespace)
    if (job.exists()):
        job.delete('Background')

def update_gig_def_commands(gig_mod: GigModule):
    stage_processors = ConfigMap.get(os.environ['AHPLOS_GIGS_INTERPRETER_MAP'],
                                     os.environ['AHPLOS_GIGS_OPERATOR_NAMESPACE'])

    for stage in gig_mod.spec.stages:
        if (not stage.get('command')):
            command = stage_processors.data.get(stage.runtime, '')
            if (command):
                stage.command = command

def create_or_patch_inputValues_secret(gig_run: GigRun, logger):
    uid = gig_run.metadata.annotations[GigRun.UUID_ANNOTATION]
    inputValues = GIG_CONSTS.GLOBAL_REGISTRY.pop(uid, '')

    if (inputValues):
        inputValuesSecret = Secret(gig_run.name, namespace=gig_run.metadata.namespace)
        inputValuesSecret[STRING_DATA] = {GIG_CONSTS.INPUT_VALUES: inputValues}
        if (not inputValuesSecret.exists()):
            inputValuesSecret['type'] = f'{GigRun.group}/{GigRun.singular}'
            inputValuesSecret.create()
            inputValuesSecret.set_owner(gig_run)
        else:
            inputValuesSecret.patch({STRING_DATA: {GIG_CONSTS.INPUT_VALUES: inputValues}})

def create_job(cron_job: CronJob, gig_run: GigRun, gig_mod: GigModule, gigrunner_secret: Secret, gig_def_secrets_map: dict) -> Job:
    spec = deepcopy(cron_job.spec.jobTemplate)
    job = Job(spec)
    job.metadata.name = None
    job.metadata.generateName = f'{gig_run.name}-'
    job.namespace = gig_run.metadata.namespace
    job.spec.template.spec[GIG_CONSTS.RESTART_POLICY] = GIG_CONSTS.NEVER
    job.spec[GIG_CONSTS.BACKOFF_LIMIT] = 0

    container = get_container(job, cron_job.annotations.get(GigRun.CONTAINER_NAME_ANNOTATION, None))
    configure_container(job, container, gig_run, gigrunner_secret, gig_def_secrets_map, gig_mod.spec.workDirSizeLimit)

    job.create()
    job.set_owner(cron_job)
    gig_run.set_owner(job)

    return job

def get_container(job: Job, name: str) -> Box:
    containers = job.spec.template.spec.containers

    if (name):
        containers = list(filter(lambda c: c.name == name, containers))

        if (not containers):
            raise kopf.PermanentError(f'Container NOT FOUND: {name}')

    return containers[0]

def configure_container(job: Job, container: Box, gig_run: GigRun, gigrunner_secret: Secret, gig_def_secrets_map: dict, working_dir_size_limit: str):
    mounted_volume = Box(name = GIGRUN, emptyDir = Box(medium = 'Memory', sizeLimit = '50M'))
    job.spec.template.spec.setdefault(GIG_CONSTS.VOLUMES, BoxList()).append(mounted_volume)

    mounted_volume_mount = Box(name = GIGRUN, mountPath = GIG_CONSTS.GIGRUN_HOME)
    container.setdefault(GIG_CONSTS.VOLUME_MOUNTS, BoxList()).append(mounted_volume_mount)

    mountedDirectory = f'/{GIGRUN}-mounted'
    gigrunner_secret_volume = Box(name = gigrunner_secret.name, secret = Box(secretName = gigrunner_secret.name, defaultMode = 0o777))
    job.spec.template.spec[GIG_CONSTS.VOLUMES].append(gigrunner_secret_volume)

    gigrunner_secret_volume_mount = Box(name = gigrunner_secret.name, mountPath = mountedDirectory)
    container[GIG_CONSTS.VOLUME_MOUNTS].append(gigrunner_secret_volume_mount)

    for secret_dir_name in gig_def_secrets_map.keys():
        secret = gig_def_secrets_map[secret_dir_name]
        secret_vol_name = secret.name.replace('.', '-')

        secret_volume = Box(name = secret_vol_name, secret = Box(secretName = secret.name, defaultMode = 0o777))
        job.spec.template.spec[GIG_CONSTS.VOLUMES].append(secret_volume)

        secret_volume_mount = Box(name = secret_vol_name, mountPath = f'{mountedDirectory}/{secret_dir_name}')
        container[GIG_CONSTS.VOLUME_MOUNTS].append(secret_volume_mount)

    create_env_vars(container, gig_run)

    container['imagePullPolicy'] = 'Always'
    set_job_working_dir(container, job, working_dir_size_limit)

    container.command = BoxList(['bash', '-ce'])
    container.args = BoxList([f'cp -rL {mountedDirectory}/. {GIG_CONSTS.GIGRUN_HOME}/ && {GIG_CONSTS.GIGRUN_HOME}/{GIG_START_SH}'])

def create_env_vars(container: Box, gig_run: GigRun):
    env = BoxList()
    env.append(Box(name = 'GIGRUN_HOME', value = GIG_CONSTS.GIGRUN_HOME))
    env.append(Box(name = 'WORKDIR', value = WORKDIR))
    env.append(Box(name = 'GIGRUN_EXTRAS_DIR', value = f'/{GIGRUN}-extra-files'))
    env.append(Box(name = 'GIGRUN_NAME', value = gig_run.name))
    env.append(Box(name = 'GIGRUN_NAMESPACE', value = gig_run.namespace))
    container.setdefault(GIG_CONSTS.ENV, env)

def set_job_working_dir(container: Box, job: Job, working_dir_size_limit):
    volumes = job.spec.template.spec.setdefault(GIG_CONSTS.VOLUMES, BoxList())
    if (not list(filter(lambda vol: vol[GIG_CONSTS.NAME] == WORK_DIR, volumes))):
        working_dir_volume = Box(name = WORK_DIR.lower(), emptyDir = Box(sizeLimit = working_dir_size_limit))
        volumes.append(working_dir_volume)

        working_dir_volumemount = Box(name = WORK_DIR.lower(), mountPath = WORKDIR)
        container.volumeMounts.append(working_dir_volumemount)
        container.workDir = WORKDIR

def create_gigrunner_secret(gig_run: GigRun, gig_mod: GigModule):
    env = Environment(loader = FileSystemLoader([RUNNER_DIR, f'{RUNNER_DIR}/{GIGRUN_FILES_DIR}']))

    secret_files = [file for file in os.listdir(f'{RUNNER_DIR}/{GIGRUN_FILES_DIR}')]

    template_data = {
        'gig_run': gig_run,
        'gig_mod': gig_mod,
        'SECRET_FILES': secret_files,
        "GIG_TIMEOUT": gig_mod.spec.activeDeadlineSeconds,
    }

    template = env.get_template(GIGRUN_FILES_SECRET_TEMPLATE)
    output = template.render(template_data)

    secret = Secret(yaml.safe_load(output))
    secret.create()
    secret.set_owner(gig_run)

    return secret