from kopf import Operation

from box import Box


class _GIG_CONSTS(type):

    GLOBAL_REGISTRY = Box()

    @property
    def BATCH_ahplos_ORG(self) -> str:
        return 'batch.ahplos.org'

    @property
    def V1_BETA1(self) -> str:
        return 'v1beta1'

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
    def GIG_REF_LABEL(self) -> str:
        return f'{self.BATCH_ahplos_ORG}/{self.GIG}'

    @property
    def JOB_NAME_SELECTOR_LABEL(self) -> str:
        return 'batch.kubernetes.io/job-name'

    @property
    def METADATA(self) -> str:
        return 'metadata'

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
    def ACTIVE_DEADLINE_SECONDS(self) -> str:
        return 'activeDeadlineSeconds'

    @property
    def NAME(self) -> str:
        return 'name'

    @property
    def NAMESPACE(self) -> str:
        return 'namespace'

    @property
    def INPUT_RECEIVED(self) -> str:
        return 'inputReceived'

    @property
    def INPUT_VALUES(self) -> str:
        return 'inputValues'

    @property
    def ENV(self) -> str:
        return 'env'

    @property
    def INPUT_FORM(self) -> str:
        return 'inputForm'

    @property
    def SECRET_ENV_VARS(self) -> str:
        return 'secretVars'

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
    def VOLUME_MOUNTS(self) -> str:
        return 'volumeMounts'

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
    def RUN_STATE(self) -> str:
        return 'runState'

    @property
    def STARTED_BY(self) -> str:
        return 'startedBy'

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
    def SUCCEEDED(self) -> str:
        return 'succeeded'

    @property
    def FAILED(self) -> str:
        return 'failed'

    @property
    def GIG_REF(self) -> str:
        return 'gigRef'

    @property
    def CREATE(self) -> Operation:
        return 'CREATE'

    @property
    def UPDATE(self) -> Operation:
        return 'UPDATE'

    @property
    def SHELL(self) -> str:
        return 'Shell'

class GIG_CONSTS(object, metaclass=_GIG_CONSTS):
    pass
