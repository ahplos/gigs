from box import Box, BoxList
from kr8s._api import Api
from kr8s._types import SpecType
from kr8s.objects import new_class
from utilities.constants import GIG_CONSTS


class GigDefinition(new_class('GigDefinition', version=f'{GIG_CONSTS.BATCH_TEKNETES_ORG}/{GIG_CONSTS.V1_BETA1}', namespaced=False)):

    group: str = GIG_CONSTS.BATCH_TEKNETES_ORG

    @property
    def secrets(self) -> BoxList:
        return  self.spec.setdefault(GIG_CONSTS.SECRETS, [])

    @property
    def formSpec(self) -> BoxList:
        return  self.spec.setdefault(GIG_CONSTS.FORM_SPEC, {})

    @property
    def stages(self) -> Box:
        return  self.spec.setdefault(GIG_CONSTS.STAGES, {})

class Gig(new_class('Gig', version=f'{GIG_CONSTS.BATCH_TEKNETES_ORG}/{GIG_CONSTS.V1_BETA1}', namespaced=True)):

    group: str = f'{GIG_CONSTS.BATCH_TEKNETES_ORG}'

    def __init__(self, resource: SpecType, namespace: str | None = None, api: Api | None = None) -> None:
        super().__init__(resource, namespace, api)
        self.raw.setdefault('spec', {})

    @property
    def gigDefinitionRef(self) -> str:
        return self.spec['gigDefinitionRef']['name']

    @gigDefinitionRef.setter
    def gigDefinitionRef(self, value):
        self.spec.setdefault('gigDefinitionRef', Box())['name'] = value

    @property
    def cronJobRef(self) -> str:
        return self.spec['cronJobRef']['name']

    @cronJobRef.setter
    def cronJobRef(self, value):
        self.spec.setdefault('cronJobRef', Box())['name'] = value

class GigRun(new_class('GigRun', version=f'{GIG_CONSTS.BATCH_TEKNETES_ORG}/{GIG_CONSTS.V1_BETA1}', namespaced=True)):

    group: str = f'{GIG_CONSTS.BATCH_TEKNETES_ORG}'

    def __init__(self, resource: SpecType, namespace: str | None = None, api: Api | None = None) -> None:
        super().__init__(resource, namespace, api)
        self.raw.setdefault('spec', {})
        self.raw.setdefault(GIG_CONSTS.STATUS, {})

    @property
    def gigRef(self) -> str:
        return self.spec[GIG_CONSTS.GIG_REF][GIG_CONSTS.NAME]

    @property
    def formSpec(self) -> BoxList:
        self.spec.setdefault(GIG_CONSTS.FORM_SPEC, BoxList())
        return self.spec.formSpec

    @formSpec.setter
    def formSpec(self, formSpec: BoxList):
        self.spec[GIG_CONSTS.FORM_SPEC] = formSpec

    @property
    def parameters(self) -> BoxList:
        self.spec.setdefault(GIG_CONSTS.PARAMETERS, Box())
        return self.spec.parameters

    @parameters.setter
    def parameters(self, parameters: Box):
        self.spec[GIG_CONSTS.PARAMETERS] = parameters

    @property
    def creationTimestamp(self) -> str:
        return self.status[GIG_CONSTS.CREATION_TIME_STAMP]

    @creationTimestamp.setter
    def creationTimestamp(self, creationTimestamp: str):
        self.status[GIG_CONSTS.CREATION_TIME_STAMP] = creationTimestamp

    @property
    def result(self) -> str:
        return self.status[GIG_CONSTS.RESULT]

    @result.setter
    def result(self, result: str):
        self.status[GIG_CONSTS.RESULT] = result

    @property
    def runTime(self) -> int:
        return self.status[GIG_CONSTS.RUN_TIME]

    @runTime.setter
    def runTime(self, runTime: int):
        self.status[GIG_CONSTS.RUN_TIME] = runTime

    @property
    def startedby(self) -> str:
        return self.annotations[GIG_CONSTS.STARTED_BY_ANNOTATION]

    @property
    def state(self) -> str:
        return self.status[GIG_CONSTS.STATE]

    @state.setter
    def state(self, state: str):
        self.status[GIG_CONSTS.STATE] = state

