from enum import StrEnum

from box import Box, BoxList

from kr8s._api import Api
from kr8s._types import SpecType
from kr8s.objects import new_class

from utilities.constants import GIG_CONSTS


class GigDefinition(new_class('GigDefinition', version=f'{GIG_CONSTS.BATCH_TEKNETES_ORG}/{GIG_CONSTS.V1_BETA1}', namespaced=True)):

    GIG_DEFINITION_ANNOTATION: str = f'{GIG_CONSTS.BATCH_TEKNETES_ORG}/gigdefinition'

    group: str = GIG_CONSTS.BATCH_TEKNETES_ORG

    @property
    def activeDeadlineSeconds(self) -> str:
        return self.spec[GIG_CONSTS.ACTIVE_DEADLINE_SECONDS]

    @property
    def gigLaunchFormRef(self) -> Box:
        return self.spec.setdefault('gigLaunchFormRef', Box())

    @gigLaunchFormRef.setter
    def gigLaunchFormRef(self, value: Box):
        self.spec['gigLaunchFormRef'] = value

    @property
    def secretEnvVars(self) -> BoxList:
        return  self.spec.setdefault(GIG_CONSTS.SECRET_ENV_VARS, BoxList())

    @property
    def stages(self) -> BoxList:
        return self.spec.setdefault(GIG_CONSTS.STAGES, BoxList())

    @property
    def workDirSizeLimit(self) -> str:
        return  self.spec['workDirSizeLimit']

class GigLaunchForm(new_class('GigLaunchForm', version=f'{GIG_CONSTS.BATCH_TEKNETES_ORG}/{GIG_CONSTS.V1_BETA1}', namespaced=True)):

    GIG_LAUNCHFORM_ANNOTATION: str = f'{GIG_CONSTS.BATCH_TEKNETES_ORG}/giglaunchform'

    group: str = GIG_CONSTS.BATCH_TEKNETES_ORG

    @property
    def inputForm(self) -> BoxList:
        return self.spec.setdefault(GIG_CONSTS.INPUT_FORM, Box())

class Gig(new_class('Gig', version=f'{GIG_CONSTS.BATCH_TEKNETES_ORG}/{GIG_CONSTS.V1_BETA1}', namespaced=True)):

    group: str = f'{GIG_CONSTS.BATCH_TEKNETES_ORG}'

    def __init__(self, resource: SpecType, namespace: str | None = None, api: Api | None = None) -> None:
        super().__init__(resource, namespace, api)
        self.raw.setdefault('spec', Box())
        self.raw.setdefault('status', Box())

    @property
    def gigDefinitionRef(self) -> Box:
        return self.spec.setdefault('gigDefinitionRef', Box())

    @gigDefinitionRef.setter
    def gigDefinitionRef(self, value: Box):
        self.spec['gigDefinitionRef'] = value

    @property
    def gigLaunchFormRef(self) -> Box:
        return self.spec.setdefault('gigLaunchFormRef', Box())

    @gigLaunchFormRef.setter
    def gigLaunchFormRef(self, value: Box):
        self.spec['gigLaunchFormRef'] = value

    @property
    def cronJobRef(self) -> str:
        return self.spec['cronJobRef'][GIG_CONSTS.NAME]

    @cronJobRef.setter
    def cronJobRef(self, value):
        self.spec.setdefault('cronJobRef', Box())[GIG_CONSTS.NAME] = value


class GigRunState(StrEnum):
    ABORTED = 'Aborted'
    ABORTING = 'Aborting'
    FAILED = 'Failed'
    INPUT_RECEIVED = 'InputReceived'
    RUNNING = 'Running'
    SUCCEEDED = 'Succeeded'
    WAITING_FOR_INPUT = 'WaitingForInput'

class GigRun(new_class('GigRun', version=f'{GIG_CONSTS.BATCH_TEKNETES_ORG}/{GIG_CONSTS.V1_BETA1}', namespaced=True)):

    CONTAINER_NAME_ANNOTATION = f'{GIG_CONSTS.BATCH_TEKNETES_ORG}/containername'
    UUID_ANNOTATION = f'{GIG_CONSTS.BATCH_TEKNETES_ORG}/uuid'

    group: str = f'{GIG_CONSTS.BATCH_TEKNETES_ORG}'

    def __init__(self, resource: SpecType, namespace: str | None = None, api: Api | None = None) -> None:
        super().__init__(resource, namespace, api)
        self.raw.setdefault('spec', Box())
        self.raw.setdefault('status', Box())

    @property
    def gigRef(self) -> str:
        return self.spec[GIG_CONSTS.GIG_REF][GIG_CONSTS.NAME]

    @property
    def inputForm(self) -> Box:
        return self.spec.setdefault(GIG_CONSTS.INPUT_FORM, BoxList())

    @inputForm.setter
    def inputForm(self, input_form: BoxList):
        self.spec.inputForm = input_form

    @property
    def job_name(self) -> str:
        return self.metadata.setdefault(GIG_CONSTS.LABELS, Box()).get(GIG_CONSTS.JOB_NAME_SELECTOR_LABEL, '')

    @property
    def inputValues(self) -> Box:
        return self.spec.setdefault(GIG_CONSTS.INPUT_VALUES, Box())

    @inputValues.setter
    def inputValues(self, inputValues: Box):
        self.spec.inputValues = inputValues

    @property
    def inputReceived(self) -> bool:
        return self.spec.setdefault(GIG_CONSTS.INPUT_RECEIVED, False)

    @inputReceived.setter
    def inputReceived(self, inputValues: bool):
        self.spec.inputReceived = True

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
    def runState(self) -> GigRunState:
        return self.spec.setdefault(GIG_CONSTS.RUN_STATE, None)

    @runState.setter
    def runState(self, runState: GigRunState):
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

