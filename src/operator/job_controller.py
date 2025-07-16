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
from utilities.controller_helper import STATE, STATUS, GIG_DEFINITION_ANNOTATION, create_gigrun_configmap, create_job

@kopf.on.field(Job.version, Job.plural, annotations={GIG_DEFINITION_ANNOTATION: kopf.PRESENT}, field='status.succeeded')  # type: ignore
def on_job_status_succeeded_change(meta, status, **kwargs):
    gig_run = GigRun(meta.name, namespace=meta.namespace)
    state = 'Completed'
    result = 'Success' if (status['succeeded'] == 1) else 'Failure'
    patch_values = {STATUS: {
        STATE: state,
        'result': result
    }}
    gig_run.patch(patch_values, subresource=STATUS, type='merge')
