import os
import uuid
from copy import deepcopy
import yaml

from box import Box, BoxList

from jinja2 import Environment, FileSystemLoader

import kopf
from kopf import AdmissionError

import kr8s
from kr8s.objects import ConfigMap, CronJob, Job, Secret

from utilities.gig_types import Gig, GigModule, GigRun, GigRunState
from utilities.constants import GIG_CONSTS

DATA = 'data'

STRING_DATA = 'stringData'

UID = 'uid'

GIG_MOD_REFS = 'gig_def_refs'

GIG_RUNNER = 'gigrunner'
GIG_RUNNER_HOME = f'/{GIG_RUNNER}'
GIG_RUNNER_SH = f'{GIG_RUNNER}.sh'
WORK_DIR = 'workDir'
GIG_RUNNER_WORKING_DIR = f'/{WORK_DIR}'

RUNNER_DIR = 'runner'
RUNNER_TEMPLATES_DIR = 'gigrunner-files'
SECRET_JINJA_TEMPLATE = 'gigrunner-secret.j2'

@kopf.on.mutate(GigRun.version, GigRun.plural, operations=[GIG_CONSTS.CREATE, GIG_CONSTS.UPDATE])  # type: ignore
def onmutategigrun(userinfo, patch, body, meta, logger, **_):
    gig_run = GigRun(body)
    uid = str(meta.annotations.get(GigRun.UUID_ANNOTATION, uuid.uuid4()))
    if (not meta.name):
        patch.metadata[GIG_CONSTS.LABELS] = {
            GIG_CONSTS.GIG_REF_LABEL: body.spec[GIG_CONSTS.GIG_REF][GIG_CONSTS.NAME],
        }

        patch.metadata[GIG_CONSTS.ANNOTATIONS] = {
            GigRun.UUID_ANNOTATION: uid
        }

        patch.setdefault(GIG_CONSTS.SPEC, {})[GIG_CONSTS.STARTED_BY] = userinfo['username']

    if (gig_run.inputValues):
        GIG_CONSTS.GLOBAL_REGISTRY[uid] = gig_run.inputValues

        patch.setdefault(GIG_CONSTS.SPEC, {})[GIG_CONSTS.INPUT_VALUES] = None
        if (meta.name):
            patch[GIG_CONSTS.SPEC][GIG_CONSTS.INPUT_RECEIVED] = True

@kopf.on.validate(GigRun.version, GigRun.plural, operations=[GIG_CONSTS.CREATE, GIG_CONSTS.UPDATE])  # type: ignore
def onvalidategigrun(body, logger, **_):
    gig_run = GigRun(body)
    gig = Gig(gig_run.gigRef, gig_run.namespace)
    if (not gig.exists() and not gig_run.metadata.get('deletionTimestamp', None)):
        raise AdmissionError(f'Gig NOT FOUND for GigRun: {gig.namespace}:{gig.name}')

    if (gig_run.inputValues):
        raise AdmissionError(f'GigRun should not be admitted with inputValues: {gig.namespace}:{gig.name}')

@kopf.on.create(GigRun.version, GigRun.plural)  # type: ignore
def on_create_gigrun(body, meta, patch, logger, **_):
    gig_run = GigRun(body)

    gig_run.refresh()
    gig = Gig.get(gig_run.gigRef, meta.namespace)
    cron_job = CronJob.get(gig.name, gig.namespace)

    namespace = gig.gigModuleRef.namespace if gig.gigModuleRef.namespace else gig_run.namespace
    gig_mod = GigModule.get(gig.gigModuleRef.name, namespace)
    gig_def_secrets_map = {}
    collect_gig_def_secrets(gig_mod, gig_def_secrets_map)
    copy_gig_def_secrets_to_gig_run_namespace(gig_def_secrets_map, gig)

    gigrunner_secret = create_gigrunner_secret(gig_run, gig_mod)

    job = create_job(cron_job, gig_run, gig_mod, gigrunner_secret, gig_def_secrets_map)

    create_or_patch_inputValues_secret(gig_run)

    patch.metadata[GIG_CONSTS.LABELS] = {
        GIG_CONSTS.JOB_NAME_SELECTOR_LABEL: job.name,
        GIG_CONSTS.RUN_STATE: GigRunState.RUNNING
    }

def collect_gig_def_secrets(gig_mod: GigModule, gig_def_secrets_map: dict):
    secret = Secret.get(gig_mod.name, gig_mod.namespace)
    gig_def_secrets_map[secret.name] =  secret

    for stage in gig_mod.spec.stages:
        if (stage.interpreter == GigModule.kind):
            name = stage.stageRef.name
            namespace = stage.stageRef.get(GIG_CONSTS.NAMESPACE, None)
            namespace = namespace if namespace else gig_mod.namespace
            secret_name = f'{namespace}-{name}'
            if (secret_name not in gig_def_secrets_map.keys()):
                collect_gig_def_secrets(GigModule.get(name, namespace), gig_def_secrets_map)

def copy_gig_def_secrets_to_gig_run_namespace(gig_def_secrets_map: dict, gig: Gig):
    for secret in gig_def_secrets_map.values():
        new_secret = Secret(f'{secret.name}', gig.namespace)
        new_secret.data = {**secret.data}
        if (new_secret.exists()):
            new_secret.patch(new_secret.to_dict())
        else:
            new_secret.raw.type = secret.raw.type
            new_secret.create()
        new_secret.set_owner(gig)

@kopf.on.update(GigRun.version, GigRun.plural, field='spec.inputReceived', value=True)  # type: ignore
def on_update_gigrun_inputReceived_True(body, patch, logger, **_):
    gig_run = GigRun(body)

    if (gig_run.inputReceived):
        create_or_patch_inputValues_secret(gig_run)

        patch[GIG_CONSTS.SPEC] = {
            GIG_CONSTS.INPUT_RECEIVED: (not gig_run.inputReceived),
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

    for stage in gig_mod.stages:
        if (not stage.get('command')):
            command = stage_processors.data.get(stage.interpreter, '')
            if (command):
                stage.command = command

def create_or_patch_inputValues_secret(gig_run: GigRun):
    uid = gig_run.metadata.annotations[GigRun.UUID_ANNOTATION]
    inputValues = GIG_CONSTS.GLOBAL_REGISTRY.pop(uid, {})

    for k in inputValues:
        inputValues[k] = str(inputValues[k])

    inputValuesSecret = Secret(gig_run.name, namespace=gig_run.metadata.namespace)

    if (not inputValuesSecret.exists()):
        inputValuesSecret[STRING_DATA] = inputValues
        inputValuesSecret['type'] = f'{GigRun.group}/{GigRun.singular}'
        inputValuesSecret.create()
        inputValuesSecret.set_owner(gig_run)
    elif (inputValues):
        inputValuesSecret.patch(
            {DATA: None, STRING_DATA: inputValues}, type='merge'
        )

def create_job(cron_job: CronJob, gig_run: GigRun, gig_mod: GigModule, gigrunner_secret: Secret, gig_def_secrets_map: dict) -> Job:
    spec = deepcopy(cron_job.spec.jobTemplate)
    job = Job(spec)
    job.metadata.name = None
    job.metadata.generateName = f'{gig_run.name}-'
    job.namespace = gig_run.metadata.namespace
    job.spec.template.spec[GIG_CONSTS.RESTART_POLICY] = GIG_CONSTS.NEVER
    job.spec[GIG_CONSTS.BACKOFF_LIMIT] = 0

    container = get_container(job, cron_job.annotations.get(GigRun.CONTAINER_NAME_ANNOTATION, None))
    configure_container(job, container, gig_run.name, gigrunner_secret, gig_def_secrets_map, gig_mod.workDirSizeLimit)

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

def configure_container(job: Job, container: Box, gig_run_name: str, gigrunner_secret: Secret, gig_def_secrets_map: dict, working_dir_size_limit: str):
    mounted_volume = Box(name = GIG_RUNNER, emptyDir = Box(medium = 'Memory', sizeLimit = '50M'))
    job.spec.template.spec.setdefault(GIG_CONSTS.VOLUMES, BoxList()).append(mounted_volume)

    mounted_volume_mount = Box(name = GIG_RUNNER, mountPath = GIG_RUNNER_HOME)
    container.setdefault(GIG_CONSTS.VOLUME_MOUNTS, BoxList()).append(mounted_volume_mount)

    mountedDirectory = f'/{GIG_RUNNER}-mounted'
    gigrunner_secret_volume = Box(name = gigrunner_secret.name, secret = Box(secretName = gigrunner_secret.name, defaultMode = 0o777))
    job.spec.template.spec[GIG_CONSTS.VOLUMES].append(gigrunner_secret_volume)

    gigrunner_secret_volume_mount = Box(name = gigrunner_secret.name, mountPath = mountedDirectory)
    container[GIG_CONSTS.VOLUME_MOUNTS].append(gigrunner_secret_volume_mount)

    for secret_name in gig_def_secrets_map.keys():
        secret_volume = Box(name = secret_name, secret = Box(secretName = secret_name, defaultMode = 0o777))
        job.spec.template.spec[GIG_CONSTS.VOLUMES].append(secret_volume)

        secret_volume_mount = Box(name = secret_name, mountPath = f'{mountedDirectory}/{secret_name}')
        container[GIG_CONSTS.VOLUME_MOUNTS].append(secret_volume_mount)

    env = BoxList()
    env.append(Box(name = 'GIG_RUNNER_HOME', value = GIG_RUNNER_HOME))
    env.append(Box(name = 'GIG_RUNNER_WORKING_DIR', value = GIG_RUNNER_WORKING_DIR))
    env.append(Box(name = 'GIG_RUN_NAME', value = gig_run_name))
    env.append(Box(name = 'POD_NAME', valueFrom = Box(fieldRef = Box(fieldPath = f'{GIG_CONSTS.METADATA}.{GIG_CONSTS.NAME}'))))
    env.append(Box(name = 'GIG_RUN_NAMESPACE', valueFrom = Box(fieldRef = Box(fieldPath = f'{GIG_CONSTS.METADATA}.{GIG_CONSTS.NAMESPACE}'))))
    env.append(Box(name = 'POD_NAMESPACE', valueFrom = Box(fieldRef = Box(fieldPath = f'{GIG_CONSTS.METADATA}.{GIG_CONSTS.NAMESPACE}'))))
    container.setdefault(GIG_CONSTS.ENV, env)

    container['imagePullPolicy'] = 'Always'
    set_job_working_dir(container, job, working_dir_size_limit)

    container.command = BoxList(['bash', '-ce'])
    container.args = BoxList([f'cp -rL {mountedDirectory}/. {GIG_RUNNER_HOME}/; {GIG_RUNNER_HOME}/{GIG_RUNNER_SH}'])

def set_job_working_dir(container: Box, job: Job, working_dir_size_limit):
    volumes = job.spec.template.spec.setdefault(GIG_CONSTS.VOLUMES, BoxList())
    if (not list(filter(lambda vol: vol[GIG_CONSTS.NAME] == WORK_DIR, volumes))):
        working_dir_volume = Box(name = WORK_DIR.lower(), emptyDir = Box(sizeLimit = working_dir_size_limit))
        volumes.append(working_dir_volume)

        working_dir_volumemount = Box(name = WORK_DIR.lower(), mountPath = GIG_RUNNER_WORKING_DIR)
        container.volumeMounts.append(working_dir_volumemount)
        container.workDir = GIG_RUNNER_WORKING_DIR

def create_gigrunner_secret(gig_run: GigRun, gig_mod: GigModule):
    env = Environment(loader = FileSystemLoader([RUNNER_DIR, f'{RUNNER_DIR}/{RUNNER_TEMPLATES_DIR}']))

    secret_files = [file for file in os.listdir(f'{RUNNER_DIR}/{RUNNER_TEMPLATES_DIR}')]

    template_data = {
        'gig_run': gig_run,
        'gig_mod': gig_mod,
        'SECRET_FILES': secret_files,
        "GIG_TIMEOUT": gig_mod.activeDeadlineSeconds,
    }

    template = env.get_template(SECRET_JINJA_TEMPLATE)
    output = template.render(template_data)

    secret = Secret(yaml.safe_load(output))
    secret.create()
    secret.set_owner(gig_run)

    return secret