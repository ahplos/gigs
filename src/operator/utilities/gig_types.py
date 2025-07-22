from collections.abc import MutableMapping
from typing import Any

from kr8s.objects import new_class
from kr8s._api import Api
from kr8s._types import SpecType

from box import Box, BoxList

BATCH_TEKNETES_ORG = 'batch.teknetes.org'

class GigDefinition(new_class('GigDefinition', version=f'{BATCH_TEKNETES_ORG}/v1beta1', namespaced=False)):

    group: str = f'{BATCH_TEKNETES_ORG}'

    def __init__(self, resource: SpecType, api: Api | None = None) -> None:
        super().__init__(resource, None, api)
        self.raw.setdefault('spec', Box()).setdefault('formSpec', BoxList())
        self.spec.setdefault('stages', BoxList())

    @property
    def formSpec(self) -> BoxList:
        self.spec.setdefault('formSpec', BoxList())
        return self.spec.formSpec

    @property
    def stages(self) -> BoxList:
        self.spec.setdefault('stages', BoxList())
        return self.spec.stages

class Gig(new_class('Gig', version=f'{BATCH_TEKNETES_ORG}/v1beta1', namespaced=True)):

    group: str = f'{BATCH_TEKNETES_ORG}'

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

class GigRun(new_class('GigRun', version=f'{BATCH_TEKNETES_ORG}/v1beta1', namespaced=True)):

    group: str = f'{BATCH_TEKNETES_ORG}'

    def __init__(self, resource: SpecType, namespace: str | None = None, api: Api | None = None) -> None:
        super().__init__(resource, namespace, api)
        self.raw.setdefault('spec', {})
        self.raw.setdefault('status', {})

    @property
    def gigRef(self) -> str:
        return self.spec['gigRef']['name']

    @property
    def formSpec(self) -> BoxList:
        self.spec.setdefault('formSpec', BoxList())
        return self.spec.formSpec

    @formSpec.setter
    def formSpec(self, formSpec: BoxList):
        self.spec['formSpec'] = formSpec

    @property
    def creationTimestamp(self) -> str:
        return self.status['crescreationTimestampult']

    @creationTimestamp.setter
    def creationTimestamp(self, creationTimestamp: str):
        self.status['creationTimestamp'] = creationTimestamp

    @property
    def result(self) -> str:
        return self.status['result']

    @result.setter
    def result(self, result: str):
        self.status['result'] = result

    @property
    def runTime(self) -> int:
        return self.status['runTime']

    @runTime.setter
    def runTime(self, runTime: int):
        self.status['runTime'] = runTime

    @property
    def startedBy(self) -> str:
        return self.status['startedBy']

    @startedBy.setter
    def startedBy(self, startedBy: str):
        self.status['startedBy'] = startedBy

    @property
    def state(self) -> str:
        return self.status['state']

    @state.setter
    def state(self, state: str):
        self.status['state'] = state

