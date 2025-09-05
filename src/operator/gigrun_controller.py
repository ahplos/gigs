import os
import uuid

import kopf
from kopf import AdmissionError

import kr8s
from kr8s.objects import ConfigMap, CronJob, Job, Secret

from utilities.controller_helper import create_gigrunner_secret, create_job
from utilities.gig_types import Gig, GigDefinition, GigRun, GigRunState
from utilities.constants import GIG_CONSTS

from teknetes_gigs_operator import TeknetesGigsOperator

DATA = 'data'

STRING_DATA = 'stringData'

UID = 'uid'

@kopf.on.mutate(
    GigRun.version,
    GigRun.plural,
    operations=['CREATE', 'UPDATE']
)  # type: ignore
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
        TeknetesGigsOperator.GLOBAL_REGISTRY[uid] = gig_run.inputValues

        patch.setdefault(GIG_CONSTS.SPEC, {})[GIG_CONSTS.INPUT_VALUES] = None
        if (meta.name):
            patch[GIG_CONSTS.SPEC][GIG_CONSTS.INPUT_RECEIVED] = True

@kopf.on.validate(GigRun.version, GigRun.plural)  # type: ignore
def onvalidategigrun(body, meta, logger, **_):
    gig_run = GigRun(body)
    gig = Gig(gig_run.gigRef, meta.namespace)
    if (not gig.exists()):
        raise AdmissionError(f'Gig NOT FOUND for GigRun: {gig.namespace}:{gig.name}')
    else:
        gig.refresh()
        gig_def = GigDefinition.get(gig.gigDefinitionRef.name, gig.gigDefinitionRef.namespace)

        secrets = [s.name for s in gig_def.secrets if not s.get('optional', False)]
        if (len(list(kr8s.get('secret', *secrets, namespace=meta.namespace))) != len(secrets)):
            raise AdmissionError(f'One or more missing REQUIRED Secrets when creating GigRun: {gig.namespace}:{secrets}')

    if (gig_run.inputValues):
        raise AdmissionError(f'GigRun should not be admitted with inputValues: {gig.namespace}:{gig.name}')

@kopf.on.create(GigRun.version, GigRun.plural)  # type: ignore
def on_create_gigrun(body, meta, patch, logger, **_):
    gig_run = GigRun(body)

    gig_run.refresh()
    gig = Gig.get(gig_run.gigRef, meta.namespace)
    cron_job = CronJob.get(gig.name, gig.namespace)

    gig_def = GigDefinition.get(gig.gigDefinitionRef.name, gig.gigDefinitionRef.namespace)
    update_gig_def_commands(gig_def)

    secret = create_gigrunner_secret(gig_run, gig_def, meta.namespace)

    job = create_job(cron_job, gig_run, gig_def, secret.name)
    gig_run.set_owner(job)

    create_or_patch_inputValues_secret(gig_run)

    patch.metadata[GIG_CONSTS.LABELS] = {
        GIG_CONSTS.JOB_NAME_SELECTOR_LABEL: job.name
    }

    patch[GIG_CONSTS.STATUS] = {
        GIG_CONSTS.RUN_STATE: GigRunState.RUNNING
    }

@kopf.on.update(GigRun.version, GigRun.plural, field='spec.inputReceived', value=True)  # type: ignore
def on_update_gigrun_inputReceived_True(body, patch, logger, **_):
    gig_run = GigRun(body)

    if (gig_run.inputReceived):
        create_or_patch_inputValues_secret(gig_run)

        patch[GIG_CONSTS.SPEC] = {
            GIG_CONSTS.INPUT_RECEIVED: (not gig_run.inputReceived)
        }

        patch[GIG_CONSTS.STATUS] = {
            GIG_CONSTS.RUN_STATE: GigRunState.RUNNING
        }

@kopf.on.delete(GigRun.version, GigRun.plural)  # type: ignore
def on_delete_gigrun(body, logger, **_):
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

def create_or_patch_inputValues_secret(gig_run: GigRun):
    uid = gig_run.metadata.annotations[GigRun.UUID_ANNOTATION]
    inputValues = TeknetesGigsOperator.GLOBAL_REGISTRY.pop(uid, {})

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