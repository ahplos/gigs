import os

import kopf
from kr8s.objects import ConfigMap
from utilities.gig_types import GIG_CONSTS, GigDefinition


@kopf.on.mutate(GigDefinition.version, GigDefinition.plural, operations=[GIG_CONSTS.CREATE,GIG_CONSTS.UPDATE]) # type: ignore
def onmutategigdefinition(patch, body, logger, **kwargs):
    gig_def: GigDefinition = GigDefinition(body)

    stage_processors = ConfigMap.get(os.environ['TEKNETES_GIGS_PROCESSOR_MAP'], os.environ['TEKNETES_GIGS_OPERATOR_NAMESPACE'])

    for stage in gig_def.stages:
        if (stage.processor == 'Shell'):
            stage.pop('command', '')
        elif (stage.processor != 'Custom'):
            stage.command = stage_processors.data[stage.processor]


    patch.setdefault(GIG_CONSTS.SPEC, {})[GIG_CONSTS.STAGES] = gig_def.stages
