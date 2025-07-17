import time
import logging
import dateutil.parser as timeparser

import kopf
from kr8s.objects import Job

from utilities.gig_types import GigRun, GigDefinition, Gig
from utilities.controller_helper import STATE, STATUS, GIG_DEFINITION_ANNOTATION, create_gigrun_configmap, create_job

@kopf.on.field(Job.version, Job.plural, annotations={GIG_DEFINITION_ANNOTATION: kopf.PRESENT}, field='status.succeeded')  # type: ignore
def on_job_status_succeeded_change(meta, status, **kwargs):
    gig_run = GigRun(meta.name, namespace=meta.namespace)
    state = 'Completed'
    result = 'Success' if (status['succeeded'] == 1) else 'Failure'
    delta = timeparser.parse(status['completionTime']) - timeparser.parse(status['startTime'])
    patch_values = {STATUS: {
        STATE: state,
        'result': result,
        'runTime': int(delta.total_seconds())
    }}
    gig_run.patch(patch_values, subresource=STATUS, type='merge')
