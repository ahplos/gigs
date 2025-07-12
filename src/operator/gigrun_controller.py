import asyncio
import datetime
import json
import logging
import random
import os

import kopf
from kr8s.objects import CronJob, Job

from utilities.gig_types import GigRun, GigDefinition, Gig
from utilities.gigrun_controller_helper import GIG_DEFINITION_ANNOTATION, create_gigrun_configmap, create_job

WORKING_DIR = os.path.join(os.path.curdir, 'WORKING_DIR')

@kopf.on.event(Job.version, Job.plural, annotations={GIG_DEFINITION_ANNOTATION: kopf.PRESENT}) # type: ignore
def on_event_job(meta, status, logger, **kwargs):
    if ('succeeded' in status):
        gig_run = GigRun(meta.name, namespace=meta.namespace)
        state = 'Completed'
        result = 'Success' if (status['succeeded'] == 1) else 'Failure'
        gig_run.patch({'status': {'state': state, 'result': result}}, subresource='status', type='merge')

@kopf.on.create(GigRun.version, GigRun.plural) # type: ignore
def on_create_gigrun(body, meta, logger, **_):
    gig_run = GigRun(body)
    gig = Gig.get(gig_run.gigRef, meta.namespace)
    cron_job = CronJob.get(gig.name, gig.namespace)
    gig_def = GigDefinition.get(gig.gigDefinitionRef)

    job = create_job(cron_job, gig_run)
    create_gigrun_configmap(job, gig_run, gig_def)

    gig_run.set_owner(job)
    job.wait("jsonpath='{.status.ready}'=1", timeout=60)
    return {'state': 'Running'}


@kopf.on.update(GigRun.version, GigRun.plural) # type: ignore
def on_update_gigrun(old, new, logger, **_):
    pass