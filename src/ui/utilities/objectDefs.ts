import {
    K8sGroupVersionKind,
    K8sResourceCommon,
} from "@openshift-console/dynamic-plugin-sdk";

export const BATCH_ahplos_ORG = "batch.ahplos.org";
export const API_VERSION = "v1beta1";

export const CRONJOB_GVK: K8sGroupVersionKind = {
    group: "batch",
    version: "v1",
    kind: "CronJob",
};

export const JOB_GVK: K8sGroupVersionKind = {
    group: "batch",
    version: "v1",
    kind: "Job",
};

export const NS_GVK: K8sGroupVersionKind = {
    kind: "Namespace",
    version: "v1"
};

export const POD_GVK: K8sGroupVersionKind = {
    group: "",
    version: "v1",
    kind: "Pod",
};

export const SA_GVK: K8sGroupVersionKind = {
    version: "v1",
    kind: "ServiceAccount",
};

export const USER_GVK: K8sGroupVersionKind = {
    group: "rbac.authorization.k8s.io",
    version: "v1",
    kind: "User",
};

export const GIG_GVK: K8sGroupVersionKind = {
    group: BATCH_ahplos_ORG,
    version: API_VERSION,
    kind: "Gig",
};

export const GIG_DEFINITION_GVK: K8sGroupVersionKind = {
    group: BATCH_ahplos_ORG,
    version: API_VERSION,
    kind: "GigModule",
};

export const GIG_LAUNCHFORM_GVK: K8sGroupVersionKind = {
    group: BATCH_ahplos_ORG,
    version: API_VERSION,
    kind: "GigForm",
};

export const GIG_RUN_GVK: K8sGroupVersionKind = {
    group: BATCH_ahplos_ORG,
    version: API_VERSION,
    kind: "GigRun",
};

export const GIG_MAP: Map<string, GigRun> = new Map();
export const CURRENT_GIG_RUN = "CURRENT_GIG_RUN";

export type InputCompGroupSpec = {
    var: string;
    components: {
        inputType: string;
        attributes: object;
        booleans: string[];
        tooltip: string;
    }[];
};

export type GigForm = K8sResourceCommon & {
    spec: {
        inputForm: InputCompGroupSpec[];
    };
};

export type StageSpec = {
    name: string;
    description?: string;
    displayName: string;
    scriptType: string;
};

export type GigModule = K8sResourceCommon & {
    spec: {
        activeDeadlineSeconds: number;
        gigLaunchFormRef: {
            name: string;
            namespace: string;
        };
        isLibrary: boolean;
        name: string;
        requiredInputParams: string[];
        stages: StageSpec[];
        workDirSizeLimit: string;
    };
};

export type Gig = K8sResourceCommon & {
    spec: {
        cronJobRef: {
            name: string;
        };
        gigDefinitionRef: {
            name: string;
            namespace: string;
        };
        gigLaunchFormRef: {
            name: string;
            namespace: string;
        };
    };

    status?: {
        latestGigRun?: {
            creationTimestamp: string;
            runState: GigRunState;
            runTime: number;
            startedBy: string;
            state: GigRunState;
        };
    };
};

export const GigRunState = {
    Aborted: "Aborted",
    Aborting: "Aborting",
    Failed: "Failed",
    InputReceived: "InputReceived",
    Running: "Running",
    Succeeded: "Succeeded",
    WaitingForInput: "WaitingForInput",
};

export type GigRunState = (typeof GigRunState)[keyof typeof GigRunState];

export type GigRun = K8sResourceCommon & {
    spec: {
        gigRef: {
            name: string;
            containerName?: string;
        };
        inputForm?: InputCompGroupSpec[];
        inputReceived?: boolean;
        inputValues?: object;
        startedBy?: string;
        runState?: GigRunState;
    };

    status?: {
        runTime?: number;
    };
};
