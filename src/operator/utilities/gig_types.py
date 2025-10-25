from enum import StrEnum
from typing import Any

from box import Box

from kr8s.objects import new_class, APIObject

from utilities.constants import GIG_CONSTS

class GigModuleMode(StrEnum):
    LIBRARY = 'Library'
    EXECUTABLE = 'Executable'

class GigModule(new_class('GigModule', version=f'{GIG_CONSTS.BATCH_AHPLOS_ORG}/{GIG_CONSTS.V1_BETA1}', namespaced=True)):

    GIG_MODULE_ANNOTATION: str = f'{GIG_CONSTS.BATCH_AHPLOS_ORG}/gigmodule'

    group: str = GIG_CONSTS.BATCH_AHPLOS_ORG

    @property
    def mode(self) -> GigModuleMode:
        return self.spec.mode

    @mode.setter
    def mode(self, mode: GigModuleMode):
        self.spec.mode = mode

    @APIObject.raw.setter
    def raw(self, value: Any) -> None:
        self._raw = Box(value, default_box=True, default_box_attr=None)

class GigForm(new_class('GigForm', version=f'{GIG_CONSTS.BATCH_AHPLOS_ORG}/{GIG_CONSTS.V1_BETA1}', namespaced=True)):

    GIG_LAUNCHFORM_ANNOTATION: str = f'{GIG_CONSTS.BATCH_AHPLOS_ORG}/giglaunchform'

    group: str = GIG_CONSTS.BATCH_AHPLOS_ORG

    @APIObject.raw.setter
    def raw(self, value: Any) -> None:
        self._raw = Box(value, default_box=True, default_box_attr=None)

class Gig(new_class('Gig', version=f'{GIG_CONSTS.BATCH_AHPLOS_ORG}/{GIG_CONSTS.V1_BETA1}', namespaced=True)):

    group: str = GIG_CONSTS.BATCH_AHPLOS_ORG

    @APIObject.raw.setter
    def raw(self, value: Any) -> None:
        self._raw = Box(value, default_box=True, default_box_attr=None)

class GigRunState(StrEnum):
    ABORTED = 'Aborted'
    ABORTING = 'Aborting'
    FAILED = 'Failed'
    INPUT_RECEIVED = 'InputReceived'
    RUNNING = 'Running'
    SUCCEEDED = 'Succeeded'
    WAITING_FOR_INPUT = 'WaitingForInput'

class GigRun(new_class('GigRun', version=f'{GIG_CONSTS.BATCH_AHPLOS_ORG}/{GIG_CONSTS.V1_BETA1}', namespaced=True)):

    CONTAINER_NAME_ANNOTATION = f'{GIG_CONSTS.BATCH_AHPLOS_ORG}/containername'
    UUID_ANNOTATION = f'{GIG_CONSTS.BATCH_AHPLOS_ORG}/uuid'

    group: str = GIG_CONSTS.BATCH_AHPLOS_ORG

    @APIObject.raw.setter
    def raw(self, value: Any) -> None:
        self._raw = Box(value, default_box=True, default_box_attr=None)

    @property
    def runState(self) -> GigRunState:
        return self.spec.setdefault(GIG_CONSTS.RUN_STATE, None)

    @runState.setter
    def runState(self, runState: GigRunState):
        self.spec[GIG_CONSTS.RUN_STATE] = runState

