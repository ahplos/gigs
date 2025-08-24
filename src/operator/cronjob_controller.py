import kopf
from kopf import Operation
from kr8s.objects import CronJob
from utilities.gig_types import GIG_CONSTS, Gig, GigDefinition

OPERATIONS: list[Operation] = [GIG_CONSTS.CREATE, GIG_CONSTS.UPDATE]


@kopf.on.mutate(
    CronJob.version,
    CronJob.plural,
    annotations={GigDefinition.GIG_DEFINITION_ANNOTATION: kopf.PRESENT},
    operations=OPERATIONS,
) # type: ignore
def onmutatecronjob(patch, meta, annotations, logger, **_):
    jobAnnotations = (
        patch.spec.setdefault('jobTemplate', {}).setdefault('metadata', {}).setdefault('annotations', {})
    )
    jobAnnotations[GigDefinition.GIG_DEFINITION_ANNOTATION] = annotations[
        GigDefinition.GIG_DEFINITION_ANNOTATION
    ]


@kopf.on.validate(
    CronJob.version,
    CronJob.plural,
    annotations={GigDefinition.GIG_DEFINITION_ANNOTATION: kopf.PRESENT},
    operations=OPERATIONS,
)   # type: ignore
def onvalidatecronjob(annotations, meta, logger, **_):
    gigDef = GigDefinition(annotations[GigDefinition.GIG_DEFINITION_ANNOTATION])
    if not gigDef.exists():
        raise kopf.AdmissionError(
            f'The GigDefinition for the {GigDefinition.GIG_DEFINITION_ANNOTATION} annotation in CronJob {meta.name} does not exist.',
            code=499,
        )

@kopf.on.create(
    CronJob.version,
    CronJob.plural,
    annotations={GigDefinition.GIG_DEFINITION_ANNOTATION: kopf.PRESENT},
)  # type: ignore
def on_create_cronjob(body, meta, logger, **_):
    cron_job = CronJob(body)
    gig = Gig(meta.name, namespace=meta.namespace)
    gig.cronJobRef = meta.name
    gig.gigDefinitionRef = meta.annotations[GigDefinition.GIG_DEFINITION_ANNOTATION]
    gig.create()
    gig.set_owner(cron_job)
    cron_job.set_owner(gig)
    logger.info(f'NEW Gig {gig.name} CREATED, and owner set to CronJob {meta.name}')

@kopf.on.update(
    CronJob.version,
    CronJob.plural,
    annotations={GigDefinition.GIG_DEFINITION_ANNOTATION: kopf.PRESENT},
)  # type: ignore
def on_update_cronjob(old, new, logger, **_):
    old_cron_job = CronJob(old)
    new_cron_job = CronJob(new)
    oldGigDef = old_cron_job.metadata.annotations[GigDefinition.GIG_DEFINITION_ANNOTATION]
    newGigDef = new_cron_job.metadata.annotations[GigDefinition.GIG_DEFINITION_ANNOTATION]
    if oldGigDef != newGigDef:
        gig = Gig.get(new_cron_job.name, new_cron_job.namespace)
        gig.patch({'spec': {'gigDefinitionRef': newGigDef}})
        logger.info(
            f'MODIFIED: GIG {gig.name} FROM {oldGigDef} TO {newGigDef} GigDefinition'
        )
