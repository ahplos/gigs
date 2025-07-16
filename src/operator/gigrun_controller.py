import asyncio
import datetime
import json
import logging
import random
import os

import kopf
from kopf import AdmissionError
from kr8s.objects import CronJob, Job

from utilities.gig_types import GigRun, GigDefinition, Gig
from utilities.controller_helper import STATE, STATUS, create_gigrun_configmap, create_job

WORKING_DIR = os.path.join(os.path.curdir, 'WORKING_DIR')

GIG_REF = 'gigRef'
NAME = 'name'
STARTED_BY = 'startedBy'

@kopf.on.mutate(GigRun.version, GigRun.plural, operation='CREATE') # type: ignore
def onmutategigrun(userinfo, patch, spec, **kwargs):
    patch.metadata['labels'] = {
        f'{Gig.group}/{Gig.kind}': spec[GIG_REF][NAME],
        f'{GigRun.group}/{STARTED_BY}': userinfo['username'].rpartition(':')[-1]
    }

@kopf.on.validate(GigRun.version, GigRun.plural) # type: ignore
def onvalidategigrun(spec, meta, **kwargs):
    gig = Gig(spec[GIG_REF][NAME], meta.namespace)
    if (not gig.exists()):
        raise AdmissionError(f'Gig NOT FOUND: {gig.namespace}:{gig.name}')

@kopf.on.create(GigRun.version, GigRun.plural) # type: ignore
def on_create_gigrun(body, meta, patch, labels, **_):
    gig_run = GigRun(body)
    gig = Gig.get(gig_run.gigRef, meta.namespace)
    cron_job = CronJob.get(gig.name, gig.namespace)
    gig_def = GigDefinition.get(gig.gigDefinitionRef)

    job = create_job(cron_job, gig_run)
    create_gigrun_configmap(job, gig_run, gig_def)

    gig_run.set_owner(job)
    job.wait("jsonpath='{.status.ready}'=1", timeout=60)
    patch[STATUS] = {
        STATE: 'Running',
        STARTED_BY: labels[f'{GigRun.group}/{STARTED_BY}']
    }


@kopf.on.update(GigRun.version, GigRun.plural) # type: ignore
def on_update_gigrun(old, new, logger, **_):
    pass