import os
import uuid

from box import Box, BoxList

import kopf
from kopf import AdmissionError

import kr8s
from kr8s.objects import CronJob, Job, Secret

from utilities.gig_types import Gig, GigModule, GigRun, GigRunState
from utilities.constants import GIG_CONSTS

DATA = 'data'

STRING_DATA = 'stringData'

GIGMOD_REFS = 'gigmod_refs'

GIGRUN = 'gigrun'
GIGRUN_START_SCRIPT = 'gigrun-start.sh'
WORK_DIR = 'workDir'
WORKDIR = f'/{WORK_DIR}'
DEFAULT_RUNTIMES = 'default-runtimes'

DEFAULT_RUNTIMES_SECRET: Secret = None

GIGRUN_CACHE = 'gigrun-cache'

GIG_CONSTS.GLOBAL_REGISTRY

@kopf.on.mutate(GigRun.version, GigRun.plural, operations=[GIG_CONSTS.CREATE, GIG_CONSTS.UPDATE], persistent=False)  # type: ignore
def onmutategigrun(userinfo, patch, body, logger, **_):
    gigrun = GigRun(body)
    uid = str(gigrun.metadata.annotations.get(GigRun.UUID_ANNOTATION, uuid.uuid4()))
    if (not gigrun.raw.metadata.name):
        patch.metadata[GIG_CONSTS.LABELS] = {
            GIG_CONSTS.GIG_REF_LABEL: gigrun.spec[GIG_CONSTS.GIG_REF][GIG_CONSTS.NAME],
        }

        patch.metadata[GIG_CONSTS.ANNOTATIONS] = {
            GigRun.UUID_ANNOTATION: uid
        }

        patch.setdefault(GIG_CONSTS.SPEC, {})[GIG_CONSTS.STARTED_BY] = userinfo['username']

    if (gigrun.spec.inputValues):
        GIG_CONSTS.GLOBAL_REGISTRY[uid] = gigrun.spec.inputValues

        patch.setdefault(GIG_CONSTS.SPEC, {})[GIG_CONSTS.INPUT_VALUES] = None
        if (gigrun.metadata.name):
            patch[GIG_CONSTS.SPEC][GIG_CONSTS.INPUT_RECEIVED] = True

@kopf.on.validate(GigRun.version, GigRun.plural, operations=[GIG_CONSTS.CREATE, GIG_CONSTS.UPDATE], persistent=False)  # type: ignore
def onvalidategigrun(body, logger, **_):
    gigrun = GigRun(body)
    gig = Gig(gigrun.spec.gigRef.name, gigrun.namespace)
    if (not gig.exists() and not gigrun.metadata.get('deletionTimestamp', None)):
        raise AdmissionError(f'Gig NOT FOUND for GigRun: {gig.namespace}:{gig.name}')

    if (gigrun.spec.inputValues):
        raise AdmissionError(f'GigRun should not be admitted with inputValues: {gig.namespace}:{gig.name}')

@kopf.on.create(GigRun.version, GigRun.plural)  # type: ignore
def on_create_gigrun(body, meta, patch, logger, **_):
    gigrun = GigRun(body)

    gig = Gig.get(gigrun.spec.gigRef.name, gigrun.namespace)
    cron_job = CronJob.get(gig.name, gig.namespace)

    namespace = gig.spec.gigModuleRef.namespace
    namespace = namespace if namespace else gigrun.namespace
    gigmod = GigModule.get(gig.spec.gigModuleRef.name, namespace)

    gigmod_secrets_map = copy_gigmod_secrets_to_gigrun_namespace(gigmod, gig)

    job = create_job(cron_job, gigrun, gigmod, gigmod_secrets_map)

    create_or_patch_inputValues_secret(gigrun, logger)

    patch.metadata[GIG_CONSTS.LABELS] = {
        GIG_CONSTS.JOB_NAME_SELECTOR_LABEL: job.name,
        GIG_CONSTS.RUN_STATE: GigRunState.RUNNING
    }

def copy_gigmod_secrets_to_gigrun_namespace(gigmod: GigModule, gig: Gig):
    gigmod_secrets_map = {}
    global DEFAULT_RUNTIMES_SECRET
    if (not DEFAULT_RUNTIMES_SECRET):
        DEFAULT_RUNTIMES_SECRET = next(kr8s.get(Secret.plural,
                                       namespace = os.environ['GIGS_OPERATOR_NAMESPACE'],
                                       field_selector = f'type={GigModule.group}/{GigModule.singular}'))
    else:
        DEFAULT_RUNTIMES_SECRET.refresh()
    gigmod_secrets_map[DEFAULT_RUNTIMES_SECRET.name] = DEFAULT_RUNTIMES_SECRET

    collect_gigmod_secrets(gigmod, gigmod_secrets_map)

    for secret in gigmod_secrets_map.values():
        new_secret = Secret(secret.name, gig.namespace)

        if (new_secret.exists()):
            new_secret.patch([{"op": "replace", "path": "/data", "value": secret.data.to_dict()}], type='json')
        else:
            new_secret.data = secret.data.copy()
            new_secret.raw.type = secret.raw.type
            new_secret.create()
            new_secret.set_owner(gig)

    return gigmod_secrets_map

def collect_gigmod_secrets(gigmod: GigModule, gigmod_secrets_map: dict, secret_key: str = None):
    secret = Secret.get(f'{gigmod.namespace}.{gigmod.name}', gigmod.namespace)
    secret_key = secret_key if secret_key else f'{gigmod.namespace}_{gigmod.name}'
    gigmod_secrets_map[secret_key] =  secret

    for stage in gigmod.spec.stages:
        if (not stage.gigRef):
            if (stage.stageRef):
                name = stage.stageRef.gigModuleRef.name
                namespace = stage.stageRef.gigModuleRef.namespace
                namespace = namespace if namespace else gigmod.namespace
                secret_key = f'{namespace}_{name}'
                if (secret_key not in gigmod_secrets_map.keys()):
                    collect_gigmod_secrets(GigModule.get(name, namespace), gigmod_secrets_map, secret_key)
            else:
                for step in stage.steps:
                    if (step.stepRef):
                        name = step.stepRef.gigModuleRef.name
                        namespace = step.stepRef.gigModuleRef.namespace
                        namespace = namespace if namespace else gigmod.namespace
                        secret_key = f'{namespace}_{name}'
                        if (secret_key not in gigmod_secrets_map.keys()):
                            collect_gigmod_secrets(GigModule.get(name, namespace), gigmod_secrets_map, secret_key)

@kopf.on.update(GigRun.version, GigRun.plural, field='spec.inputReceived', value=True)  # type: ignore
def on_update_gigrun_inputReceived_true(body, patch, logger, **_):
    gigrun = GigRun(body)

    if (gigrun.spec.inputReceived):
        create_or_patch_inputValues_secret(gigrun, logger)

        patch[GIG_CONSTS.SPEC] = {
            GIG_CONSTS.INPUT_RECEIVED: (not gigrun.spec.inputReceived),
            GIG_CONSTS.RUN_STATE: GigRunState.RUNNING
        }

@kopf.on.delete(GigRun.version, GigRun.plural)  # type: ignore
def on_delete_gigrun(body, logger, **_):
    gigrun = GigRun(body)
    job = Job(gigrun.name, gigrun.namespace)
    if (job.exists()):
        job.delete('Background')

def create_or_patch_inputValues_secret(gigrun: GigRun, logger):
    uid = gigrun.metadata.annotations[GigRun.UUID_ANNOTATION]
    inputValues = GIG_CONSTS.GLOBAL_REGISTRY.pop(uid, '')

    if (inputValues):
        inputValuesSecret = Secret(gigrun.name, namespace=gigrun.metadata.namespace)
        inputValuesSecret[STRING_DATA] = {GIG_CONSTS.INPUT_VALUES: inputValues}
        if (not inputValuesSecret.exists()):
            inputValuesSecret['type'] = f'{GigRun.group}/{GigRun.singular}-cache'
            inputValuesSecret.create()
            inputValuesSecret.set_owner(gigrun)
        else:
            inputValuesSecret.patch({STRING_DATA: {GIG_CONSTS.INPUT_VALUES: inputValues}})

def create_job(cron_job: CronJob, gigrun: GigRun, gigmod: GigModule, gigmod_secrets_map: dict) -> Job:
    spec = cron_job.spec.jobTemplate.copy()
    job = Job(spec)
    job.name = None
    job.metadata.generateName = f'{gigrun.name}-'
    job.namespace = gigrun.metadata.namespace
    job.spec.template.spec[GIG_CONSTS.RESTART_POLICY] = GIG_CONSTS.NEVER
    job.spec[GIG_CONSTS.BACKOFF_LIMIT] = 0

    container = get_container(job, cron_job.annotations.get(GigRun.CONTAINER_NAME_ANNOTATION, None))
    configure_container(job, container, gigrun, gigmod, gigmod_secrets_map)

    job.create()
    job.set_owner(cron_job)
    gigrun.set_owner(job)

    return job

def get_container(job: Job, name: str) -> Box:
    containers = job.spec.template.spec.containers

    if (name):
        containers = list(filter(lambda c: c.name == name, containers))

        if (not containers):
            raise kopf.PermanentError(f'Container NOT FOUND: {name}')

    return containers[0]

def configure_container(job: Job, container: Box, gigrun: GigRun, gigmod: GigModule, gigmod_secrets_map: dict):
    mounted_volume = Box(name = GIGRUN, emptyDir = Box(medium = 'Memory', sizeLimit = '50M'))
    job.spec.template.spec.setdefault(GIG_CONSTS.VOLUMES, BoxList()).append(mounted_volume)

    mounted_volume_mount = Box(name = GIGRUN, mountPath = GIG_CONSTS.GIGRUN_HOME)
    container.setdefault(GIG_CONSTS.VOLUME_MOUNTS, BoxList()).append(mounted_volume_mount)

    mountedDirectory = f'/{GIGRUN}-mounted'

    container.command = BoxList(['bash', '-ce'])
    cp_gigrun_files_command = f'cp -rL {mountedDirectory}/. {GIG_CONSTS.GIGRUN_HOME}/'
    gigrun_start_command = f"${{GIGRUN_DEFAULT_SCRIPTS_HOME}}/{GIGRUN_START_SCRIPT} '{gigmod.namespace}_{gigmod.name}'"
    container.args = BoxList([f'{cp_gigrun_files_command} && {gigrun_start_command}'])

    for secret_dir_name in gigmod_secrets_map.keys():
        secret = gigmod_secrets_map[secret_dir_name]
        secret_vol_name = secret.name.replace('.', '-')

        secret_volume = Box(name = secret_vol_name, secret = Box(secretName = secret.name, defaultMode = 0o777))
        job.spec.template.spec[GIG_CONSTS.VOLUMES].append(secret_volume)

        secret_volume_mount = Box(name = secret_vol_name, mountPath = f'{mountedDirectory}/{secret_dir_name}')
        container[GIG_CONSTS.VOLUME_MOUNTS].append(secret_volume_mount)

    create_env_vars(container, gigrun, gigmod)

    container['imagePullPolicy'] = 'Always'
    set_job_working_dir(container, job, gigmod.spec.workDirSizeLimit)

def create_env_vars(container: Box, gigrun: GigRun, gigmod: GigModule):
    env = BoxList()
    env.append(Box(name = 'GIGRUN_HOME', value = GIG_CONSTS.GIGRUN_HOME))
    env.append(Box(name = 'GIGRUN_DEFAULT_SCRIPTS_HOME', value = f'{GIG_CONSTS.GIGRUN_HOME}/{DEFAULT_RUNTIMES_SECRET.name}'))
    env.append(Box(name = 'WORKDIR', value = WORKDIR))
    env.append(Box(name = 'GIGRUN_EXTRAS_DIR', value = f'/{GIGRUN}-extra-files'))
    env.append(Box(name = 'GIG_NAME', value = gigrun.spec.gigRef.name))
    env.append(Box(name = 'GIGRUN_NAME', value = gigrun.name))
    env.append(Box(name = 'GIGRUN_NAMESPACE', value = gigrun.namespace))
    env.append(Box(name = 'GIGRUN_ACTIVE_DEADLINE_SECONDS', value = f'{gigmod.spec.activeDeadlineSeconds}'))

    input_params = ' '.join([input_param.name for input_param in gigmod.spec.inputParams])
    env.append(Box(name = 'GIGRUN_INPUT_PARAMS', value = input_params))

    required_input_params = ' '.join([input_param.name if input_param.required else '' for input_param in gigmod.spec.inputParams])
    env.append(Box(name = 'GIGRUN_REQUIRED_INPUT_PARAMS', value = required_input_params))

    container.setdefault(GIG_CONSTS.ENV, env)

def set_job_working_dir(container: Box, job: Job, working_dir_size_limit):
    volumes = job.spec.template.spec.setdefault(GIG_CONSTS.VOLUMES, BoxList())
    if (not list(filter(lambda vol: vol[GIG_CONSTS.NAME] == WORK_DIR, volumes))):
        working_dir_volume = Box(name = WORK_DIR.lower(), emptyDir = Box(sizeLimit = working_dir_size_limit))
        volumes.append(working_dir_volume)

        working_dir_volumemount = Box(name = WORK_DIR.lower(), mountPath = WORKDIR)
        container.volumeMounts.append(working_dir_volumemount)
        container.workDir = WORKDIR
