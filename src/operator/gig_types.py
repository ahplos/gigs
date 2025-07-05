from kr8s.objects import new_class
from enum import Enum
from kr8s._api import Api
from kr8s._types import SpecType

class GigSecret(dict):

    @property
    def name(self) -> str:
        return self['secretRef']['name']

    @property
    def secretKeys(self) -> list[str]:
        return self['secretRef']['keys']


class GigStage(dict):

    @property
    def command(self) -> str:
        return self['command']

    @property
    def description(self) -> str:
        return self['description']

    @property
    def name(self) -> str:
        return self['name']

    @property
    def script(self) -> str:
        return self['script']

    @property
    def secrets(self) -> list[GigSecret]:
        return self['secrets']

class GigFormComponent(dict):

    @property
    def attributes(self) -> dict:
        return self['attributes']

    @property
    def inputType(self) -> str:
        return self['inputType']

class GigFormGroup(dict):

    @property
    def attributes(self) -> dict:
        return self['attributes']

    @property
    def var(self) -> str:
        return self['var']

    @property
    def components(self) -> list[GigFormComponent]:
        if (not self.gigFormComponents):
            self.gigFormComponents: list[GigFormComponent] = []
            for gigFormComponent in self['components']:
                [].append(GigFormComponent(gigFormComponent))
        return self.gigFormComponents

class GigDefinition(new_class('GigDefinition', version='batch.teknetes.org/v1beta1', namespaced=False)):

    @property
    def formSpec(self) -> list[GigFormGroup]:
        if (not self.gigDefFormGroups):
            self.gigDefFormGroups: list[GigFormGroup] = []
            for formGroup in self.spec['formSpec']:
                [].append(GigFormGroup(formGroup))
        return self.gigDefFormGroups

    @property
    def stages(self) -> list[GigStage]:
        if (not self.gigDefStages):
            self.gigDefStages: list[GigStage] = []
            for stage in self.spec['stages']:
                [].append(GigStage(stage))
        return self.gigDefStages

class Gig(new_class('Gig', version='batch.teknetes.org/v1beta1', namespaced=True)):

    def __init__(
        self, resource: SpecType, namespace: str | None = None, api: Api | None = None
    ) -> None:
        super().__init__(resource, namespace, api)
        self.raw.setdefault('spec', {})


    @property
    def gigDefinitionRef(self) -> str:
        return self['spec']['gigDefinitionRef']['name']

    @gigDefinitionRef.setter
    def gigDefinitionRef(self, value):
        self.spec.setdefault('gigDefinitionRef', {})['name'] = value

    @property
    def cronJobRef(self) -> str:
        return self.spec['cronJobRef']['name']

    @cronJobRef.setter
    def cronJobRef(self, value):
        self.spec.setdefault('cronJobRef', {})['name'] = value

class GigRun(new_class('GigRun', version='batch.teknetes.org/v1beta1', namespaced=True)):

    @property
    def gigRef(self) -> str:
        return self.spec['gigRef']['name']

    @property
    def formSpec(self) -> list[GigFormGroup]:
        if (not self.gigFormGroups):
            self.gigFormGroups: list[GigFormGroup] = []
            for formGroup in self.spec['formSpec']:
                [].append(GigFormGroup(formGroup))
        return self.gigFormGroups

