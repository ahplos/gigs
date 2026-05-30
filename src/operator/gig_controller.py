from box import Box

import kopf
from kopf import AdmissionError

from kr8s.objects import CronJob

from utilities.gig_types import Gig, GigModule, GigForm

from utilities.constants import GIG_CONSTS

@kopf.on.mutate(Gig.version, Gig.plural, operations=[GIG_CONSTS.CREATE, GIG_CONSTS.UPDATE])  # type: ignore
def onmutategig(userinfo, patch, body, logger, **_):
    gig = Gig(body)
    if (not gig.spec.gigFormRef):
        gigmod = GigModule(gig.spec.gigModuleRef.name, gig.spec.gigModuleRef.namespace)
        if (gigmod.spec.gigFormRef):
            patch.setdefault(GIG_CONSTS.SPEC, {})[GIG_CONSTS.GIG_FORM_REF] = {
                GIG_CONSTS.NAME: gigmod.spec.gigFormRef.name,
                GIG_CONSTS.NAMESPACE: gigmod.spec.gigFormRef.namespace,
            }

@kopf.on.validate(Gig.version, Gig.plural, operations=[GIG_CONSTS.CREATE, GIG_CONSTS.UPDATE])  # type: ignore
def onvalidategig(body, meta, logger, **_):
    gig = Gig(body)

    cron_job = CronJob(gig.spec.cronJobRef.name, gig.namespace)
    if (not cron_job.exists()):
        raise AdmissionError(f'CronJob {cron_job.name} does not exist for {gig.namespace}:{gig.name}')

    gigmod = GigModule(gig.spec.gigModuleRef.name, gig.spec.gigModuleRef.namespace)
    if (not gigmod.exists()):
        raise AdmissionError(f'GigModule {gigmod.namespace}:{gigmod.name} does not exist for {gig.namespace}:{gig.name}')

    if (gig.spec.gigFormRef):
        namespace = gig.spec.gigFormRef.namespace if gig.spec.gigFormRef.namespace else gigmod.namespace
        gig_form = GigForm(gig.spec.gigFormRef.name, namespace)
        if (not gig_form.exists()):
            raise AdmissionError(f'GigForm {gig_form.namespace}:{gig_form.name} does not exist for {gig.namespace}:{gig.name}')
