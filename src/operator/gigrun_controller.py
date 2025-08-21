import os
import uuid
import logging

from box import Box

import kopf
from kopf import AdmissionError
from kr8s.objects import ConfigMap, CronJob, Secret

from utilities.controller_helper import create_gigrun_configmap, create_job
from utilities.gig_types import Gig, GigDefinition, GigRun
from utilities.constants import GIG_CONSTS

WORKING_DIR = os.path.join(os.path.curdir, 'WORKING_DIR')

DATA = 'data'

STRING_DATA = 'stringData'

GIGRUN_INPUTVALUES_MAP = Box()

@kopf.on.mutate(
    GigRun.version,
    GigRun.plural,
    operations=['CREATE'],
)  # type: ignore
def onmutatecreate(userinfo, patch, body, meta, **kwargs):
    logging.error('===================== onmutatecreate')
    patch.metadata[GIG_CONSTS.LABELS] = {
        GIG_CONSTS.GIG_REF_LABEL: body.spec[GIG_CONSTS.GIG_REF][GIG_CONSTS.NAME],
    }

    patch[GIG_CONSTS.SPEC] = {
        GIG_CONSTS.STARTED_BY: userinfo['username']
    }


@kopf.on.mutate(
    GigRun.version,
    GigRun.plural,
    operations=['CREATE', 'UPDATE'],
)  # type: ignore
def onmutategigrun(userinfo, patch, body, meta, **kwargs):
    gig_run = GigRun(body)
    if (gig_run.inputvalues):
        logging.error(f'===================== onmutategigrun: {gig_run.inputvalues}')
        uuid_key = meta.get('uid', str(uuid.uuid4()))
        GIGRUN_INPUTVALUES_MAP[uuid_key] = gig_run.inputvalues
        patch[GIG_CONSTS.METADATA] = {
            GIG_CONSTS.ANNOTATIONS: {
                GigRun.UUID_ANNOTATION: uuid_key
            }
        }

        patch[GIG_CONSTS.SPEC] = {
            GIG_CONSTS.FORM: {
                GIG_CONSTS.INPUTVALUES: None,
            },
            GIG_CONSTS.RUN_STATE: GIG_CONSTS.INPUT_RECEIVED if (gig_run.runState == GIG_CONSTS.WAITING_FOR_INPUT) else GIG_CONSTS.RUNNING
        }

@kopf.on.validate(GigRun.version, GigRun.plural)  # type: ignore
def onvalidategigrun(body, spec, meta, logger, **kwargs):
    gig_run = GigRun(body)
    logger.error(f'===================== onvalidategigrun foo: {gig_run.to_dict()}')
    gig = Gig(gig_run.gigRef, meta.namespace)
    if not gig.exists():
        raise AdmissionError(f'Gig NOT FOUND: {gig.namespace}:{gig.name}')

    if (gig_run.inputvalues):
        raise AdmissionError(f'Gig should not be admitted with inputvalues: {gig.namespace}:{gig.name}')

@kopf.on.create(GigRun.version, GigRun.plural)  # type: ignore
def on_create_gigrun(body, meta, patch, annotations, **_):
    gig_run = GigRun(body)

    gig_run.refresh()
    gig = Gig.get(gig_run.gigRef, meta.namespace)
    cron_job = CronJob.get(gig.name, gig.namespace)

    gig_def = GigDefinition.get(gig.gigDefinitionRef)
    update_gig_def_commands(gig_def)

    config_map = create_gigrun_configmap(gig_run, gig_def, meta.namespace)

    job = create_job(cron_job, gig_run, config_map.name)
    gig_run.set_owner(job)

    create_or_patch_inputvalues_secret(gig_run)

    patch.metadata[GIG_CONSTS.LABELS] = {
        GIG_CONSTS.JOB_NAME_SELECTOR_LABEL: job.name
    }

@kopf.on.update(GigRun.version, GigRun.plural, field='spec.runState', value=GIG_CONSTS.INPUT_RECEIVED)  # type: ignore
def on_update_gigrun_inputvalues(body, annotations, patch, **kwargs):
    gig_run = GigRun(body)

    create_or_patch_inputvalues_secret(gig_run)

    patch[GIG_CONSTS.SPEC] = {
        GIG_CONSTS.RUN_STATE: GIG_CONSTS.RUNNING,
    }

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