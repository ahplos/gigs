import {
    K8sGroupVersionKind,
    K8sResourceCommon,
} from '@openshift-console/dynamic-plugin-sdk';

export const NS_GVK: K8sGroupVersionKind = { kind: 'Namespace', version: 'v1' };
export const CRONJOB_GVK: K8sGroupVersionKind = { group: 'batch', version: 'v1', kind: 'CronJob' };
export const POD_GVK: K8sGroupVersionKind = { group: '', version: 'v1', kind: 'Pod' };

export const BATCH_TEKNETES_ORG = 'batch.teknetes.org';
const API_VERSION = 'v1beta1';

export const GIG_GVK: K8sGroupVersionKind = {
    group: BATCH_TEKNETES_ORG,
    version: API_VERSION,
    kind: 'Gig',
};

export const GIG_DEFINITION_GVK: K8sGroupVersionKind = {
    group: BATCH_TEKNETES_ORG,
    version: API_VERSION,
    kind: 'GigDefinition',
};

export const GIG_RUN_GVK: K8sGroupVersionKind = {
    group: BATCH_TEKNETES_ORG,
    version: API_VERSION,
    kind: 'GigRun',
};

export const GIG_MAP: Map<string, GigRun> = new Map();
export const CURRENT_GIG_RUN = 'CURRENT_GIG_RUN';

export type FormSpec = [] & {
    var: string;
    components: {
        inputType: string;
        attributes: object;
        booleans: string[];
        var: string;
    }[];
};

export type GigDefinition = K8sResourceCommon & {
    spec: {
        name: string;
        form?: {
            spec?: FormSpec[];
        }
    };
};

export type Gig = K8sResourceCommon & {
    spec: {
        cronJobRef: {
            name: string;
        };
        gigDefinitionRef: {
            name: string;
        };
    };
    status?: {
        latestGigRun?: {
            creationTimestamp: string;
            result: GigRunResult;
            runTime: number;
            startedBy: string;
            state: GigRunState;
        };
    };
};

export const GigRunState = {
    Aborting: 'Aborting',
    WaitingForInput: 'WaitingForInput',
    Running: 'Running',
    Completed: 'Completed',
}

export type GigRunState = typeof GigRunState[keyof typeof GigRunState];

export const GigRunResult = {
    Success: 'Success',
    Failure: 'Failure',
}

export type GigRunResult = typeof GigRunResult[keyof typeof GigRunResult];

export type GigRun = K8sResourceCommon & {
    spec: {
        gigRef: {
            name: string;
            containerName?: string;
        };
        form?: {
            spec?: FormSpec;
            inputvalues?: object;
        }
        runState?: GigRunState
        startedBy?: string;
    };

    status?: {
        result?: GigRunResult;
        runTime?: number;
    };
};