import kopf
from kopf import AdmissionError

from kr8s.objects import CronJob

from utilities.gig_types import Gig, GigModule, GigForm

from utilities.constants import GIG_CONSTS

@kopf.on.validate(Gig.version, Gig.plural, operations=[GIG_CONSTS.CREATE, GIG_CONSTS.UPDATE])  # type: ignore
def onvalidategig(body, meta, logger, **_):
    gig = Gig(body)

    cron_job = CronJob(gig.cronJobRef, gig.namespace)
    if (not cron_job.exists()):
        raise AdmissionError(f'CronJob {cron_job.name} does not exist for {gig.namespace}:{gig.name}')

    gig_def = GigModule(gig.sourceRef.name, gig.sourceRef.namespace)
    if (not gig_def.exists()):
        raise AdmissionError(f'CronJob {gig_def.namespace}:{gig_def.name} does not exist for {gig.namespace}:{gig.name}')

    if (gig.gigFormRef):
        namespace = gig.gigFormRef.get(GIG_CONSTS.NAMESPACE, gig_def.namespace)
        gig_launch_form = GigForm(gig.gigFormRef.name, namespace)
        if (not gig_launch_form.exists()):
            raise AdmissionError(f'CronJob {gig_launch_form.namespace}:{gig_launch_form.name} does not exist for {gig.namespace}:{gig.name}')
