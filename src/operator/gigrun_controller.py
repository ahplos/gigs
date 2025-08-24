import os
import uuid

from box import Box

import kopf
from kopf import AdmissionError

import kr8s
from kr8s.objects import ConfigMap, CronJob, Job, Secret

from utilities.controller_helper import create_gigrun_configmap, create_job
from utilities.gig_types import Gig, GigDefinition, GigRun, GigRunState
from utilities.constants import GIG_CONSTS

DATA = 'data'

STRING_DATA = 'stringData'

GIGRUN_INPUTVALUES_MAP = Box()

@kopf.on.mutate(
    GigRun.version,
    GigRun.plural,
    operations=['CREATE'],
)  # type: ignore
def onmutatecreate(userinfo, patch, body, meta, **kwargs):
    patch.metadata[GIG_CONSTS.LABELS] = {
        GIG_CONSTS.GIG_REF_LABEL: body.spec[GIG_CONSTS.GIG_REF][GIG_CONSTS.NAME],
    }

    patch[GIG_CONSTS.SPEC] = {
        GIG_CONSTS.STARTED_BY: userinfo['username'],
        GIG_CONSTS.RUN_STATE: GigRunState.RUNNING
    }


@kopf.on.mutate(
    GigRun.version,
    GigRun.plural,
    operations=['CREATE', 'UPDATE'],
)  # type: ignore
def onmutategigrun(userinfo, patch, body, meta, **kwargs):
    gig_run = GigRun(body)
    if (gig_run.inputvalues):
        uuid_key = meta.get('uid', str(uuid.uuid4()))
        GIGRUN_INPUTVALUES_MAP[uuid_key] = gig_run.inputvalues
        patch[GIG_CONSTS.METADATA] = {
            GIG_CONSTS.ANNOTATIONS: {
                GigRun.UUID_ANNOTATION: uuid_key
            }
        }

        runState = GigRunState.INPUT_RECEIVED if (gig_run.runState == GigRunState.WAITING_FOR_INPUT) else GigRunState.RUNNING
        patch[GIG_CONSTS.SPEC] = {
            GIG_CONSTS.FORM: {
                GIG_CONSTS.INPUTVALUES: None,
            },
            GIG_CONSTS.RUN_STATE: runState
        }

@kopf.on.validate(GigRun.version, GigRun.plural)  # type: ignore
def onvalidategigrun(body, spec, meta, logger, **kwargs):
    gig_run = GigRun(body)
    gig = Gig(gig_run.gigRef, meta.namespace)
    if (not gig.exists()):
        raise AdmissionError(f'Gig NOT FOUND for GigRun: {gig.namespace}:{gig.name}')
    else:
        gig.refresh()
        gig_def = GigDefinition.get(gig.gigDefinitionRef)

        secrets = [s.name for s in gig_def.secrets if not s.get('optional', False)]
        if (len(list(kr8s.get('secret', *secrets, namespace=meta.namespace))) != len(secrets)):
            raise AdmissionError(f'One or more missing REQUIRED Secrets when creating GigRun: {gig.namespace}:{secrets}')

    if (gig_run.inputvalues):
        raise AdmissionError(f'GigRun should not be admitted with inputvalues: {gig.namespace}:{gig.name}')

@kopf.on.create(GigRun.version, GigRun.plural)  # type: ignore
def on_create_gigrun(body, meta, patch, logger, **_):
    gig_run = GigRun(body)

    gig_run.refresh()
    gig = Gig.get(gig_run.gigRef, meta.namespace)
    cron_job = CronJob.get(gig.name, gig.namespace)

    gig_def = GigDefinition.get(gig.gigDefinitionRef)
    update_gig_def_commands(gig_def)

    config_map = create_gigrun_configmap(gig_run, gig_def, meta.namespace)

    job = create_job(cron_job, gig_run, gig_def, config_map.name)
    gig_run.set_owner(job)

    create_or_patch_inputvalues_secret(gig_run)

    patch.metadata[GIG_CONSTS.LABELS] = {
        GIG_CONSTS.JOB_NAME_SELECTOR_LABEL: job.name
    }

@kopf.on.update(GigRun.version, GigRun.plural, field='spec.runState', value=GIG_CONSTS.INPUT_RECEIVED)  # type: ignore
def on_update_gigrun_inputvalues(body, patch, **kwargs):
    gig_run = GigRun(body)

    create_or_patch_inputvalues_secret(gig_run)

    patch[GIG_CONSTS.SPEC] = {
        GIG_CONSTS.RUN_STATE: GIG_CONSTS.RUNNING,
    }

@kopf.on.delete(GigRun.version, GigRun.plural)  # type: ignore
def on_delete_gigrun(body, logger, **kwargs):
    gig_run = GigRun(body)
    job = Job.get(gig_run.job_name, gig_run.namespace)
    job.delete('Background')

def update_gig_def_commands(gig_def: GigDefinition):
    stage_processors = ConfigMap.get(os.environ['TEKNETES_GIGS_PROCESSOR_MAP'],
                                     os.environ['TEKNETES_GIGS_OPERATOR_NAMESPACE'])

    for stage in gig_def.stages:
        if (not stage.get('command')):
            command = stage_processors.data.get(stage.processor, '')
            if (command):
                stage.command = command

def create_or_patch_inputvalues_secret(gig_run: GigRun):
    uuid_key = gig_run.annotations.pop(GigRun.UUID_ANNOTATION, gig_run.metadata.get('uid', None))
    if (uuid_key):
        inputValues = GIGRUN_INPUTVALUES_MAP.pop(uuid_key, {})
        if(inputValues):
            for k in inputValues:
                inputValues[k] = str(inputValues[k])

            inputvaluesSecret = Secret(gig_run.name, namespace=gig_run.metadata.namespace)

            if (not inputvaluesSecret.exists()):
                inputvaluesSecret[STRING_DATA] = inputValues
                inputvaluesSecret['type'] = f'{GigRun.group}/{GigRun.singular}'
                inputvaluesSecret.create()
                inputvaluesSecret.set_owner(gig_run)
            else:
                inputvaluesSecret.patch(
                    {DATA: None, STRING_DATA: inputValues}, type='merge'
                )