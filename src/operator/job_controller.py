import dateutil.parser as timeparser

import kopf
from kr8s.objects import Job

from utilities.gig_types import GIG_CONSTS, GigRun, Gig


@kopf.on.field(
    Job.version,
    Job.plural,
    annotations={GIG_CONSTS.GIG_DEFINITION_ANNOTATION: kopf.PRESENT},
    field=f'{GIG_CONSTS.STATUS}.{GIG_CONSTS.SUCCEEDED}',
    value=kopf.PRESENT,
)  # type: ignore
def on_job_completed(meta, status, logger, **kwargs):
    gig_run = GigRun.get(
        namespace=meta.namespace,
        label_selector={GIG_CONSTS.JOB_NAME_SELECTOR_LABEL: meta.name},
    )
    gig = Gig(gig_run.gigRef, namespace=gig_run.namespace)

    state = GIG_CONSTS.COMPLETED
    result = (
        GIG_CONSTS.SUCCESS
        if (status[GIG_CONSTS.SUCCEEDED] == 1)
        else GIG_CONSTS.FAILURE
    )
    delta = timeparser.parse(status[GIG_CONSTS.COMPLETION_TIME]) - timeparser.parse(
        status[GIG_CONSTS.START_TIME]
    )
    patch_values = {
        GIG_CONSTS.STARTED_BY: gig_run.annotations[GIG_CONSTS.STARTED_BY_ANNOTATION],
        GIG_CONSTS.CREATION_TIME_STAMP: gig_run.metadata.creationTimestamp,
        GIG_CONSTS.STATE: state,
        GIG_CONSTS.RESULT: result,
        GIG_CONSTS.RUN_TIME: int(delta.total_seconds()),
    }
    gig_run.patch(
        {GIG_CONSTS.STATUS: patch_values}, subresource=GIG_CONSTS.STATUS, type='merge'
    )
    gig.patch(
        {GIG_CONSTS.STATUS: {GIG_CONSTS.LATEST_GIG_RUN: patch_values}},
        subresource=GIG_CONSTS.STATUS,
        type='merge',
    )
