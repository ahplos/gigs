from kopf import Operation


class _GIG_CONSTS(type):
    @property
    def BATCH_TEKNETES_ORG(self) -> str:
        return 'batch.teknetes.org'

    @property
    def V1_BETA1(self) -> str:
        return 'v1beta1'

    @property
    def GIG_DEFINITION(self) -> str:
        return 'gigdefinition'

    @property
    def GIG_DEFINITIONS(self) -> str:
        return 'gigdefinitions'

    @property
    def GIG(self) -> str:
        return 'gig'

    @property
    def GIGS(self) -> str:
        return 'gigs'

    @property
    def GIG_RUN(self) -> str:
        return 'gigrun'

    @property
    def GIG_RUNS(self) -> str:
        return 'gigruns'

    @property
    def GIG_DEFINITION_ANNOTATION(self) -> str:
        return f'{self.BATCH_TEKNETES_ORG}/{self.GIG_DEFINITION}'

    @property
    def CONTAINER_NAME_ANNOTATION(self) -> str:
        return f'{self.BATCH_TEKNETES_ORG}/containername'

    @property
    def STARTED_BY_ANNOTATION(self) -> str:
        return f'{self.BATCH_TEKNETES_ORG}/startedby'

    @property
    def USER_INPUT_ANNOTATION(self) -> str:
        return f'{self.BATCH_TEKNETES_ORG}/userinput'

    @property
    def UUID_ANNOTATION(self) -> str:
        return f'{self.BATCH_TEKNETES_ORG}/uuid'

    @property
    def GIG_REF_LABEL(self) -> str:
        return f'{self.BATCH_TEKNETES_ORG}/{self.GIG}'

    @property
    def JOB_NAME_SELECTOR_LABEL(self) -> str:
        return 'batch.kubernetes.io/job-name'

    @property
    def ANNOTATIONS(self) -> str:
        return 'annotations'

    @property
    def LABELS(self) -> str:
        return 'labels'

    @property
    def SPEC(self) -> str:
        return 'spec'

    @property
    def STATUS(self) -> str:
        return 'status'

    @property
    def NAME(self) -> str:
        return 'name'

    @property
    def PARAMETERS(self) -> str:
        return 'parameters'

    @property
    def FORM_SPEC(self) -> str:
        return 'formSpec'

    @property
    def SECRETS(self) -> str:
        return 'secrets'

    @property
    def STAGES(self) -> str:
        return 'stages'

    @property
    def VOLUMES(self) -> str:
        return 'volumes'

    @property
    def LATEST_GIG_RUN(self) -> str:
        return 'latestGigRun'

    @property
    def CREATION_TIME_STAMP(self) -> str:
        return 'creationTimestamp'

    @property
    def RESULT(self) -> str:
        return 'result'

    @property
    def RUN_TIME(self) -> str:
        return 'runTime'

    @property
    def STATE(self) -> str:
        return 'state'

    @property
    def STARTED_BY(self) -> str:
        return 'startedby'

    @property
    def START_TIME(self) -> str:
        return 'startTime'

    @property
    def COMPLETION_TIME(self) -> str:
        return 'completionTime'

    @property
    def IMAGE_PULL_POLICY(self) -> str:
        return 'imagePullPolicy'

    @property
    def RESTART_POLICY(self) -> str:
        return 'restartPolicy'

    @property
    def BACKOFF_LIMIT(self) -> str:
        return 'backoffLimit'

    @property
    def ALWAYS(self) -> str:
        return 'Always'

    @property
    def NEVER(self) -> str:
        return 'Never'

    @property
    def WAITING_FOR_INPUT(self) -> str:
        return 'WaitingForInput'

    @property
    def RUNNING(self) -> str:
        return 'Running'

    @property
    def COMPLETED(self) -> str:
        return 'Completed'

    @property
    def SUCCESS(self) -> str:
        return 'Success'

    @property
    def FAILURE(self) -> str:
        return 'Failure'

    @property
    def SUCCEEDED(self) -> str:
        return 'succeeded'

    @property
    def GIG_REF(self) -> str:
        return 'gigRef'

    @property
    def CREATE(self) -> Operation:
        return 'CREATE'

    @property
    def UPDATE(self) -> Operation:
        return 'UPDATE'


class GIG_CONSTS(object, metaclass=_GIG_CONSTS):
    pass
