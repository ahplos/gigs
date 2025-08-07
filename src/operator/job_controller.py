import dateutil.parser as timeparser

import kopf
from kr8s.objects import Job

from utilities.gig_types import GigRun, Gig
from utilities.controller_helper import STATE, STATUS, GIG_DEFINITION_ANNOTATION

@kopf.on.field(Job.version, Job.plural, annotations={GIG_DEFINITION_ANNOTATION: kopf.PRESENT}, field='status.completionTime')  # type: ignore
def on_job_status_succeeded_change(meta, status, logger, **kwargs):
    gig_run = GigRun.get(meta.name, namespace=meta.namespace)
    gig = Gig(gig_run.gigRef, namespace=gig_run.namespace)

    state = 'Completed'
    result = 'Success' if (status['succeeded'] == 1) else 'Failure'
    delta = timeparser.parse(status['completionTime']) - timeparser.parse(status['startTime'])
    patch_values = {
        'startedBy': gig_run.startedBy,
        'creationTimestamp': gig_run.metadata.creationTimestamp,
        STATE: state,
        'result': result,
        'runTime': int(delta.total_seconds())
    }
    gig_run.patch({STATUS: patch_values}, subresource=STATUS, type='merge')
    gig.patch({STATUS: {'latestGigRun': patch_values}}, subresource=STATUS, type='merge')
