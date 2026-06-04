from enum import StrEnum
from typing import Any

from box import Box, BoxList

from kr8s._api import Api
from kr8s._types import SpecType
from kr8s.objects import new_class, APIObject

from utilities.constants import GIG_CONSTS

class GigModuleMode(StrEnum):
    LIBRARY = 'Library'
    EXECUTABLE = 'Executable'

class GigModule(new_class('GigModule', version=f'{GIG_CONSTS.BATCH_AHPLOS_ORG}/{GIG_CONSTS.V1_BETA1}', namespaced=True)):

    GIG_MODULE_ANNOTATION: str = f'{GIG_CONSTS.BATCH_AHPLOS_ORG}/gigmodule'

    GIG_MAX_THREAD_COUNT_ANNOTATION: str = f'{GIG_CONSTS.BATCH_AHPLOS_ORG}/gigmodule'

    group: str = GIG_CONSTS.BATCH_AHPLOS_ORG

    def __create_box(self, value: Any = {}):
        return Box(value, default_box=True, default_box_attr=None)

    def __init__(self, resource: SpecType, namespace: str | None = None, api: Api | None = None) -> None:
        super().__init__(resource, namespace, api)
        self.raw.setdefault('metadata', self.__create_box()).setdefault('labels', self.__create_box())
        self.raw.metadata.setdefault('annotations', self.__create_box())
        self.raw.setdefault('spec', self.__create_box()).setdefault('gigFormRef', self.__create_box())
        self.raw.spec.setdefault('inputParams', BoxList())
        self.raw.spec.setdefault('runtimes', BoxList())
        self.raw.spec.setdefault('secretVars', BoxList())
        self.raw.spec.setdefault('stages', BoxList())
        self.raw.spec.setdefault('supportFiles', BoxList())
        self.raw.setdefault('status', self.__create_box())

    @APIObject.raw.setter
    def raw(self, value: Any) -> None:
        self._raw = Box(value, default_box=True, default_box_attr=None)

class GigForm(new_class('GigForm', version=f'{GIG_CONSTS.BATCH_AHPLOS_ORG}/{GIG_CONSTS.V1_BETA1}', namespaced=True)):

    GIG_LAUNCHFORM_ANNOTATION: str = f'{GIG_CONSTS.BATCH_AHPLOS_ORG}/gigform'

    group: str = GIG_CONSTS.BATCH_AHPLOS_ORG

    def __create_box(self, value: Any = {}):
        return Box(value, default_box=True, default_box_attr=None)

    def __init__(self, resource: SpecType, namespace: str | None = None, api: Api | None = None) -> None:
        super().__init__(resource, namespace, api)
        self.raw.setdefault('metadata', self.__create_box()).setdefault('labels', self.__create_box())
        self.raw.metadata.setdefault('annotations', self.__create_box())
        self.raw.setdefault('spec', self.__create_box())
        self.raw.spec.setdefault('inputForm', BoxList())
        self.raw.setdefault('status', self.__create_box())

    @APIObject.raw.setter
    def raw(self, value: Any) -> None:
        self._raw = Box(value, default_box=True, default_box_attr=None)

class Gig(new_class('Gig', version=f'{GIG_CONSTS.BATCH_AHPLOS_ORG}/{GIG_CONSTS.V1_BETA1}', namespaced=True)):

    group: str = GIG_CONSTS.BATCH_AHPLOS_ORG

    def __create_box(self, value: Any = {}):
        return Box(value, default_box=True, default_box_attr=None)

    def __init__(self, resource: SpecType, namespace: str | None = None, api: Api | None = None) -> None:
        super().__init__(resource, namespace, api)
        self.raw.setdefault('metadata', self.__create_box()).setdefault('labels', self.__create_box())
        self.raw.metadata.setdefault('annotations', self.__create_box())
        self.raw.setdefault('spec', self.__create_box())
        self.raw.spec.setdefault('cronJobRef', self.__create_box())
        self.raw.spec.setdefault('gigFormRef', self.__create_box())
        self.raw.spec.setdefault('gigModuleRef', self.__create_box())
        self.raw.setdefault('status', self.__create_box())

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

    def __create_box(self, value: Any = {}):
        return Box(value, default_box=True, default_box_attr=None)

    def __init__(self, resource: SpecType, namespace: str | None = None, api: Api | None = None) -> None:
        super().__init__(resource, namespace, api)
        self.raw.setdefault('metadata', self.__create_box()).setdefault('labels', self.__create_box())
        self.raw.metadata.setdefault('annotations', self.__create_box())
        self.raw.setdefault('spec', self.__create_box()).setdefault('gigRef', self.__create_box())
        self.raw.spec.setdefault('inputForm', BoxList())
        self.raw.spec.setdefault('inputValues', self.__create_box())
        self.raw.setdefault('status', self.__create_box())

    @APIObject.raw.setter
    def raw(self, value: Any) -> None:
        self._raw = Box(value, default_box=True, default_box_attr=None)

class GigHook(new_class('GigHook', version=f'{GIG_CONSTS.BATCH_AHPLOS_ORG}/{GIG_CONSTS.V1_BETA1}', namespaced=True)):

    group: str = GIG_CONSTS.BATCH_AHPLOS_ORG

    def __create_box(self, value: Any = {}):
        return Box(value, default_box=True, default_box_attr=None)

    def __init__(self, resource: SpecType, namespace: str | None = None, api: Api | None = None) -> None:
        super().__init__(resource, namespace, api)
        self.raw.setdefault('metadata', self.__create_box()).setdefault('labels', self.__create_box())
        self.raw.metadata.setdefault('annotations', self.__create_box())
        self.raw.setdefault('spec', self.__create_box()).setdefault('eventData', BoxList())
        self.raw.spec.setdefault('isEnabled', False)

    @APIObject.raw.setter
    def raw(self, value: Any) -> None:
        self._raw = Box(value, default_box=True, default_box_attr=None)

