from box import Box, BoxList
from kr8s._api import Api
from kr8s._types import SpecType
from kr8s.objects import new_class
from utilities.constants import GIG_CONSTS


class GigDefinition(new_class('GigDefinition', version=f'{GIG_CONSTS.BATCH_TEKNETES_ORG}/{GIG_CONSTS.V1_BETA1}', namespaced=False)):

    GIG_DEFINITION_ANNOTATION: str = f'{GIG_CONSTS.BATCH_TEKNETES_ORG}/gigdefinition'

    group: str = GIG_CONSTS.BATCH_TEKNETES_ORG

    @property
    def gigRef(self) -> str:
        return self.spec[GIG_CONSTS.GIG_REF][GIG_CONSTS.NAME]

    @property
    def form(self) -> BoxList:
        return self.spec.setdefault(GIG_CONSTS.FORM, Box())

    @property
    def form_spec(self) -> BoxList:
        return  self.spec.form.setdefault(GIG_CONSTS.SPEC, BoxList())

    @property
    def secretEnvVars(self) -> BoxList:
        return  self.spec.setdefault(GIG_CONSTS.SECRET_ENV_VARS, [])

    @property
    def secrets(self) -> BoxList:
        return  self.spec.setdefault(GIG_CONSTS.SECRETS, [])

    @property
    def stages(self) -> Box:
        return  self.spec.setdefault(GIG_CONSTS.STAGES, Box())

class Gig(new_class('Gig', version=f'{GIG_CONSTS.BATCH_TEKNETES_ORG}/{GIG_CONSTS.V1_BETA1}', namespaced=True)):

    group: str = f'{GIG_CONSTS.BATCH_TEKNETES_ORG}'

    def __init__(self, resource: SpecType, namespace: str | None = None, api: Api | None = None) -> None:
        super().__init__(resource, namespace, api)
        self.raw.setdefault('spec', {})
        self.raw.setdefault('status', {})

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

    CONTAINER_NAME_ANNOTATION = f'{GIG_CONSTS.BATCH_TEKNETES_ORG}/containername'
    UUID_ANNOTATION = f'{GIG_CONSTS.BATCH_TEKNETES_ORG}/uuid'

    group: str = f'{GIG_CONSTS.BATCH_TEKNETES_ORG}'

    def __init__(self, resource: SpecType, namespace: str | None = None, api: Api | None = None) -> None:
        super().__init__(resource, namespace, api)
        self.raw.setdefault('spec', {})
        self.raw.setdefault('status', {})

    @property
    def gigRef(self) -> str:
        return self.spec[GIG_CONSTS.GIG_REF][GIG_CONSTS.NAME]

    @property
    def form(self) -> Box:
        return self.spec.setdefault(GIG_CONSTS.FORM, Box())

    @property
    def form_spec(self) -> BoxList:
        return self.form.setdefault(GIG_CONSTS.SPEC, BoxList())

    @form_spec.setter
    def form_spec(self, form_spec: BoxList):
        self.form.spec = form_spec

    @property
    def inputvalues(self) -> BoxList:
        return self.form.setdefault(GIG_CONSTS.INPUTVALUES, Box())

    @inputvalues.setter
    def inputvalues(self, inputvalues: Box):
        self.form.inputvalues = inputvalues

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
    def runState(self) -> int:
        return self.spec[GIG_CONSTS.RUN_STATE]

    @runState.setter
    def runState(self, runState: int):
        self.spec[GIG_CONSTS.RUN_STATE] = runState

    @property
    def runTime(self) -> int:
        return self.status[GIG_CONSTS.RUN_TIME]

    @runTime.setter
    def runTime(self, runTime: int):
        self.status[GIG_CONSTS.RUN_TIME] = runTime

    @property
    def startedBy(self) -> str:
        return self.spec[GIG_CONSTS.STARTED_BY]

