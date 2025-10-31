import dateutil.parser as timeparser
from datetime import datetime

import kopf
from kr8s.objects import Job

from utilities.gig_types import GIG_CONSTS, Gig, GigModule, GigRun, GigRunState

WATCH_FIELDS=[f'{GIG_CONSTS.STATUS}.{GIG_CONSTS.SUCCEEDED}', f'{GIG_CONSTS.STATUS}.{GIG_CONSTS.FAILED}']

@kopf.on.field(
    Job.version,
    Job.plural,
    annotations={GigModule.GIG_MODULE_ANNOTATION: kopf.PRESENT},
    field=f'{GIG_CONSTS.STATUS}.{GIG_CONSTS.SUCCEEDED}',
    value=kopf.PRESENT,
)  # type: ignore
@kopf.on.field(
    Job.version,
    Job.plural,
    annotations={GigModule.GIG_MODULE_ANNOTATION: kopf.PRESENT},
    field=f'{GIG_CONSTS.STATUS}.{GIG_CONSTS.FAILED}',
    value=kopf.PRESENT,
)  # type: ignore
def on_job_completed(meta, status, logger, **_):
    gig_run = GigRun.get(
        namespace=meta.namespace,
        label_selector={GIG_CONSTS.JOB_NAME_SELECTOR_LABEL: meta.name},
    )
    gig = Gig(gig_run.spec.gigRef.name, namespace=gig_run.namespace)

    runState = GigRunState.SUCCEEDED if status.get(GIG_CONSTS.SUCCEEDED) else GigRunState.FAILED
    runState = GigRunState.ABORTED if (gig_run.spec.runState == GigRunState.ABORTING) else runState

    time = status.get(GIG_CONSTS.COMPLETION_TIME, datetime.now().strftime('%Y-%m-%dT%H:%M:%S' + status[GIG_CONSTS.START_TIME][-1]))
    delta = timeparser.parse(time) - timeparser.parse(status[GIG_CONSTS.START_TIME])

    status_patch_values = {
        GIG_CONSTS.NAME: gig_run.name,
        GIG_CONSTS.STARTED_BY: gig_run.spec.startedBy,
        GIG_CONSTS.CREATION_TIME_STAMP: gig_run.metadata.creationTimestamp,
        GIG_CONSTS.RUN_STATE: runState,
        GIG_CONSTS.RUN_TIME: int(delta.total_seconds()),
    }

    gig_run.patch({GIG_CONSTS.STATUS: status_patch_values}, subresource=GIG_CONSTS.STATUS, type='merge')

    gig_run.patch({
            GIG_CONSTS.STATUS: {
                GIG_CONSTS.RUN_STATE: runState
            }
        },
        type='merge'
    )

    gig.patch(
        {GIG_CONSTS.STATUS: {GIG_CONSTS.LATEST_GIG_RUN: status_patch_values}},
        subresource=GIG_CONSTS.STATUS,
        type='merge',
    )
