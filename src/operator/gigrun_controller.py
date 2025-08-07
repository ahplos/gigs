import asyncio
import datetime
import json
import logging
import random
import os

from box import Box

import kopf
from kopf import AdmissionError
from kr8s.objects import CronJob

from utilities.gig_types import GigRun, GigDefinition, Gig
from utilities.controller_helper import STATUS, create_gigrun_configmap, create_job

WORKING_DIR = os.path.join(os.path.curdir, 'WORKING_DIR')

GIG_REF = 'gigRef'
NAME = 'name'
STARTED_BY = 'startedBy'

STATE = 'state'

GIG_RUN_MAP = Box()

@kopf.on.mutate(GigRun.version, GigRun.plural, operation='CREATE') # type: ignore
def onmutategigrun(userinfo, body, patch, spec, **kwargs):
    gig_run = GigRun(body)
    GIG_RUN_MAP[f'{gig_run.metadata.namespace}/{gig_run.name}'] = gig_run.inputParams

    patch.metadata['annotations'] = {
        f'{GigRun.group}/{STARTED_BY}': userinfo['username'].rpartition(':')[-1]
    }

    patch.metadata['labels'] = {
        f'{Gig.group}/{Gig.singular}': spec[GIG_REF][NAME],
    }

    patch.spec['inputParams'] = {}


@kopf.on.validate(GigRun.version, GigRun.plural) # type: ignore
def onvalidategigrun(spec, meta, **kwargs):
    gig = Gig(spec[GIG_REF][NAME], meta.namespace)
    if (not gig.exists()):
        raise AdmissionError(f'Gig NOT FOUND: {gig.namespace}:{gig.name}')

@kopf.on.create(GigRun.version, GigRun.plural) # type: ignore
def on_create_gigrun(body, meta, patch, annotations, **_):
    gig_run = GigRun(body)
    gig = Gig.get(gig_run.gigRef, meta.namespace)
    cron_job = CronJob.get(gig.name, gig.namespace)
    gig_def = GigDefinition.get(gig.gigDefinitionRef)

    job = create_job(cron_job, gig_run)
    create_gigrun_configmap(job, gig_run, gig_def, meta.namespace)

    gig_run.set_owner(job)
    patch[STATUS] = {
        STARTED_BY: annotations.get(f'{GigRun.group}/{STARTED_BY}')
    }

@kopf.on.update(GigRun.plural, field='spec.formSpec')  # type: ignore
def on_update_gigrun_form_spec(old, new, logger, **kwargs):
    gig_run = GigRun(new)

    patch_values = {
        STATE: 'WaitingForUserInput',
    }
    gig_run.patch({STATUS: patch_values}, subresource=STATUS, type='merge')

@kopf.on.update(GigRun.plural, field='spec.submissionData')  # type: ignore
def on_update_gigrun_submission_data(old, new, patch, logger, **kwargs):
    gig_run = GigRun(new)
    with open('/{{ GIGRUN_WORKING_DIR }}/.env', 'a') as env_file:
        for key, value in new['spec']['submissionData']:
            env_file.writelines(f"{key}='{value}'")

    patch['spec'] = {
        'spec': {
            'formSpec': None,
            'submissionData': None
        },
        STATUS: {
            STATE: 'Running',
        }
    }
