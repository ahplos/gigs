import kopf

from box import Box

from kr8s.objects import CronJob

from utilities.gig_types import GIG_CONSTS, Gig, GigModule, GigForm

@kopf.on.mutate(
    CronJob.version,
    CronJob.plural,
    annotations={GigModule.GIG_MODULE_ANNOTATION: kopf.PRESENT},
    operations=[GIG_CONSTS.CREATE, GIG_CONSTS.UPDATE],
) # type: ignore
def onmutatecronjob(patch, meta, annotations, logger, **_):
    jobAnnotations = (
        patch.spec.setdefault('jobTemplate', {}).setdefault('metadata', {}).setdefault('annotations', {})
    )

    jobAnnotations[GigModule.GIG_MODULE_ANNOTATION] = annotations[
        GigModule.GIG_MODULE_ANNOTATION
    ]

@kopf.on.validate(
    CronJob.version,
    CronJob.plural,
    annotations={GigModule.GIG_MODULE_ANNOTATION: kopf.PRESENT},
    operations=[GIG_CONSTS.CREATE, GIG_CONSTS.UPDATE]
)   # type: ignore
def onvalidatecronjob(annotations, meta, logger, **_):
    gig_def_ref = get_name_namespace_from_anno(annotations[GigModule.GIG_MODULE_ANNOTATION])
    gigDef = GigModule.get(gig_def_ref.name, namespace = gig_def_ref.namespace)
    if (not gigDef.exists()):
        raise kopf.AdmissionError(
            f'The GigModule {annotations[GigModule.GIG_MODULE_ANNOTATION]} for the {GigModule.GIG_MODULE_ANNOTATION} annotation in CronJob {meta.name} does not exist.',
            code=499,
        )

    gig_form_ref = get_name_namespace_from_anno(annotations.get(GigForm.GIG_LAUNCHFORM_ANNOTATION))
    if (gig_form_ref):
        gigForm = GigForm(gig_form_ref.name, namespace = gig_form_ref.namespace)
        if (not gigForm.exists()):
            raise kopf.AdmissionError(
                f'The GigForm for the {GigForm.GIG_LAUNCHFORM_ANNOTATION} annotation in CronJob {meta.name} does not exist.',
                code=499,
            )

@kopf.on.create(
    CronJob.version,
    CronJob.plural,
    annotations={GigModule.GIG_MODULE_ANNOTATION: kopf.PRESENT},
)  # type: ignore
def on_create_cronjob(body, meta, annotations, logger, **_):
    cron_job = CronJob(body)
    gig = Gig(meta.name, namespace=meta.namespace)
    gig.cronJobRef = meta.name

    gig_def_ref = get_name_namespace_from_anno(annotations[GigModule.GIG_MODULE_ANNOTATION])
    gig_mod = GigModule.get(gig_def_ref.name, gig_def_ref.namespace)
    gig.gigModuleRef.name = gig_mod.name
    gig.gigModuleRef.namespace = gig_mod.namespace

    gig_form_ref = get_name_namespace_from_anno(annotations.get(GigForm.GIG_LAUNCHFORM_ANNOTATION))
    if (gig_form_ref or gig_mod.gigFormRef):
        gig.gigFormRef.name = gig_form_ref.name if gig_form_ref else gig_mod.gigFormRef
        gig.gigFormRef.namespace = gig_form_ref.namespace if gig_form_ref else gig_mod.gigFormRef.namespace

    gig.create()
    gig.set_owner(cron_job)
    cron_job.set_owner(gig)
    logger.info(f'NEW Gig {gig.name} CREATED, and owner set to CronJob {meta.name}')

@kopf.on.update(
    CronJob.version,
    CronJob.plural,
    annotations={GigModule.GIG_MODULE_ANNOTATION: kopf.PRESENT},
)  # type: ignore
def on_update_cronjob(old, new, patch, logger, **_):
    old_cron_job = CronJob(old)
    new_cron_job = CronJob(new)
    oldGigDef = old_cron_job.metadata.annotations[GigModule.GIG_MODULE_ANNOTATION]
    newGigDef = new_cron_job.metadata.annotations[GigModule.GIG_MODULE_ANNOTATION]
    if oldGigDef != newGigDef:
        patch.setdefault(GIG_CONSTS.METADATA, {})[GIG_CONSTS.ANNOTATIONS] = {
            GigModule.GIG_MODULE_ANNOTATION: oldGigDef
        }

def get_name_namespace_from_anno(annotation_val):
    ref = annotation_val.split('/')
    name = ref[0] if len(ref) == 1 else ref[1]
    namespace = '' if len(ref) == 1 else ref[0]
    return Box(name = name, namespace = namespace)
