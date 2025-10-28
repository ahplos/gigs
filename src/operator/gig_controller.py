import kopf
from kopf import AdmissionError

from kr8s.objects import CronJob

from utilities.gig_types import Gig, GigModule, GigForm

from utilities.constants import GIG_CONSTS

@kopf.on.validate(Gig.version, Gig.plural, operations=[GIG_CONSTS.CREATE, GIG_CONSTS.UPDATE])  # type: ignore
def onvalidategig(body, meta, logger, **_):
    gig = Gig(body)

    cron_job = CronJob(gig.spec.cronJobRef.name, gig.namespace)
    if (not cron_job.exists()):
        raise AdmissionError(f'CronJob {cron_job.name} does not exist for {gig.namespace}:{gig.name}')

    gig_mod = GigModule(gig.spec.gigModuleRef.name, gig.spec.gigModuleRef.namespace)
    if (not gig_mod.exists()):
        raise AdmissionError(f'GigModule {gig_mod.namespace}:{gig_mod.name} does not exist for {gig.namespace}:{gig.name}')

    if (gig.spec.gigFormRef):
        namespace = gig.spec.gigFormRef.namespace if gig.spec.gigFormRef.namespace else gig_mod.namespace
        gig_form = GigForm(gig.spec.gigFormRef.name, namespace)
        if (not gig_form.exists()):
            raise AdmissionError(f'GigForm {gig_form.namespace}:{gig_form.name} does not exist for {gig.namespace}:{gig.name}')
