import logging
import os
import uuid

import kopf
from box import Box
from kopf import AdmissionError
from kr8s.objects import CronJob, Job, Secret
from utilities.controller_helper import create_gigrun_configmap, create_job
from utilities.gig_types import GIG_CONSTS, Gig, GigDefinition, GigRun

WORKING_DIR = os.path.join(os.path.curdir, 'WORKING_DIR')

STRING_DATA = 'stringData'


PARAMETERS_MAP = Box()

@kopf.on.mutate(
    GigRun.version,
    GigRun.plural,
    labels={GIG_CONSTS.GIG_REF_LABEL: kopf.ABSENT},
    annotations={GIG_CONSTS.UUID_ANNOTATION: kopf.ABSENT, GIG_CONSTS.STARTED_BY_ANNOTATION: kopf.ABSENT},
)  # type: ignore
def onmutategcreate(userinfo, patch, spec, annotations, labels, logger, **kwargs):
    patch.metadata['labels'] = {
        GIG_CONSTS.GIG_REF_LABEL: spec[GIG_CONSTS.GIG_REF][GIG_CONSTS.NAME],
    }

    uuid_key = f'{uuid.uuid4()}'
    userinfo = Box(userinfo)
    patch.metadata['annotations'] = {
        GIG_CONSTS.UUID_ANNOTATION: uuid_key,
        GIG_CONSTS.STARTED_BY_ANNOTATION: userinfo.username
    }


@kopf.on.mutate(
    GigRun.version,
    GigRun.plural,
    annotations={GIG_CONSTS.UUID_ANNOTATION: kopf.PRESENT},
    field='spec.parameters',
    value=kopf.PRESENT,
)  # type: ignore
def onmutateparameters(userinfo, patch, spec, annotations, labels, logger, **kwargs):
    uuid_key = annotations[GIG_CONSTS.UUID_ANNOTATION]
    PARAMETERS_MAP[uuid_key] = Box(spec.get(GIG_CONSTS.PARAMETERS, {}))
    patch[GIG_CONSTS.SPEC] = {GIG_CONSTS.PARAMETERS: None}


@kopf.on.validate(GigRun.version, GigRun.plural)  # type: ignore
def onvalidategigrun(spec, meta, **kwargs):
    gig = Gig(spec[GIG_CONSTS.GIG_REF][GIG_CONSTS.NAME], meta.namespace)
    if not gig.exists():
        raise AdmissionError(f'Gig NOT FOUND: {gig.namespace}:{gig.name}')


@kopf.on.create(GigRun.version, GigRun.plural)  # type: ignore
def on_create_gigrun(body, meta, patch, annotations, logger, **_):
    gig_run = GigRun(body)

    gig_run.refresh()
    gig = Gig.get(gig_run.gigRef, meta.namespace)
    cron_job = CronJob.get(gig.name, gig.namespace)
    gig_def = GigDefinition.get(gig.gigDefinitionRef)

    config_map = create_gigrun_configmap(gig_run, gig_def, meta.namespace)

    job = create_job(cron_job, gig_run, config_map.name)
    gig_run.set_owner(job)

    create_or_patch_input_params_secret(gig_run)

    patch.metadata[GIG_CONSTS.LABELS] = {
        GIG_CONSTS.JOB_NAME_SELECTOR_LABEL: job.name
    }

    patch[GIG_CONSTS.STATUS] = {
        GIG_CONSTS.STARTED_BY: gig_run.metadata.annotations[GIG_CONSTS.STARTED_BY_ANNOTATION],
    }



@kopf.on.update(GigRun.version, GigRun.plural, field='spec.formSpec')  # type: ignore
def on_update_gigrun_formSpec(patch, **kwargs):
    patch[GIG_CONSTS.STATUS] = {
        GIG_CONSTS.STATE: GIG_CONSTS.WAITING_FOR_INPUT,
    }


@kopf.on.update(GigRun.version, GigRun.plural, field='spec.parameters')  # type: ignore
def on_update_gigrun_parameters(body, new, patch, **kwargs):
    gig_run = GigRun(body)

    create_or_patch_input_params_secret(gig_run)

    patch[GIG_CONSTS.STATUS] = {
        GIG_CONSTS.STATE: GIG_CONSTS.RUNNING,
    }


def create_or_patch_input_params_secret(gig_run: GigRun):
    parametersSecret = Secret(gig_run.name, namespace=gig_run.metadata.namespace)
    parametersSecret.metadata.generateName = f'{gig_run.name}-'
    uuid_key = gig_run.annotations[GIG_CONSTS.UUID_ANNOTATION]
    parametersSecret[STRING_DATA] = PARAMETERS_MAP.pop(uuid_key, {})

    if not parametersSecret.exists():
        parametersSecret['type'] = f'{GigRun.group}/{GigRun.singular}'
        parametersSecret.create()
        parametersSecret.set_owner(gig_run)
    else:
        parametersSecret.patch(
            {STRING_DATA: parametersSecret[STRING_DATA]}, type='merge'
        )