import {
    K8sGroupVersionKind,
    K8sResourceCommon,
} from "@openshift-console/dynamic-plugin-sdk";

export const BATCH_AHPLOS_ORG = "batch.ahplos.org";
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
    group: BATCH_AHPLOS_ORG,
    version: API_VERSION,
    kind: "Gig",
};

export const GIG_MODULE_GVK: K8sGroupVersionKind = {
    group: BATCH_AHPLOS_ORG,
    version: API_VERSION,
    kind: "GigModule",
};

export const GIG_FORM_GVK: K8sGroupVersionKind = {
    group: BATCH_AHPLOS_ORG,
    version: API_VERSION,
    kind: "GigForm",
};

export const GIG_RUN_GVK: K8sGroupVersionKind = {
    group: BATCH_AHPLOS_ORG,
    version: API_VERSION,
    kind: "GigRun",
};

export const GIG_HOOK_GVK: K8sGroupVersionKind = {
    group: BATCH_AHPLOS_ORG,
    version: API_VERSION,
    kind: "GigHook",
};

export const GIG_MAP: Map<string, GigRun> = new Map();
export const CURRENT_GIG_RUN = "CURRENT_GIG_RUN";

export type InputCompGroupSpec = {
    inputType: string;
    attributes: object;
    var: string;
};

export type GigForm = K8sResourceCommon & {
    spec: {
        formTitle?: {
            title: string;
            headingLevel: 'h1' | 'h2'  | 'h3'  | 'h4'  | 'h5'  | 'h6' ;
        }
        inputForm: InputCompGroupSpec[];
    };
};

export type GigModule = K8sResourceCommon & {
    spec: {
        activeDeadlineSeconds: number;
        gigFormRef: {
            name: string;
            namespace: string;
        };
        mode: boolean;
        name: string;
        requiredInputParams: string[];
        stages: StageSpec[];
        workDirSizeLimit: string;
    };
};

export type StageSpec = {
    name: string;
    description?: string;
    steps: StepSpec[];
    interpreter: string;
    stageRef: {
        name: string;
        gigModuleRef: {
            name: string;
            namespace: string;
        }
    }
};

export type StepSpec = {
    name: string;
    interpreter: string;
    stageRef: {
        gigModuleRef: {
            name: string;
            namespace: string;
        }
    }
}

export type Gig = K8sResourceCommon & {
    spec: {
        cronJobRef: {
            name: string;
        };
        gigModuleRef: {
            name: string;
            namespace: string;
        };
        gigFormRef: {
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
        formTitle?: {
            title: string;
            headingLevel: 'h1' | 'h2'  | 'h3'  | 'h4'  | 'h5'  | 'h6' ;
        }
        inputForm?: InputCompGroupSpec[];
        inputReceived?: boolean;
        inputValues?: string;
        startedBy?: string;
        runState?: GigRunState;
    };

    status?: {
        runTime?: number;
    };
};

export type GigHookEventData = {
    key: string;
    inputVar?: string;
    source: 'Header'| 'Payload' | 'QueryString' ;
    validation?: {
        bool?: boolean;
        match?: string;
        secretKeyRef?: {
            name: string;
            key: string;
        }
        type?: 'Regex' | 'HMAC';
    }
};

export type GigHook = K8sResourceCommon & {
    spec: {
        isEnabled: boolean;
        eventData: GigHookEventData[]
    };
};
