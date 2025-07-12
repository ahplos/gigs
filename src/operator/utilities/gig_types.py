from collections.abc import MutableMapping
from typing import Any

from kr8s.objects import new_class, APIObject
from enum import Enum
from kr8s._api import Api
from kr8s._types import SpecType

from box import Box, BoxList

class GigDefinition(new_class('GigDefinition', version='batch.teknetes.org/v1beta1', namespaced=False)):

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

class Gig(new_class('Gig', version='batch.teknetes.org/v1beta1', namespaced=True)):

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

class GigRun(new_class('GigRun', version='batch.teknetes.org/v1beta1', namespaced=True)):

    plural: str = 'gigruns'
    singular: str = 'gigrun'

    @property
    def gigRef(self) -> str:
        return self.spec['gigRef']['name']

    @property
    def formSpec(self) -> BoxList:
        self.spec.setdefault('formSpec', BoxList())
        return self.spec.formSpec

