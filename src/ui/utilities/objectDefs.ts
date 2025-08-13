import {
    K8sGroupVersionKind,
    K8sResourceCommon,
    K8sResourceKind,
    useK8sWatchResource,
    WatchK8sResource
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

export type FormSpec = {
    var: string;
    components: {
        inputType: string;
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
            startedby: string;
            state: GigRunState;
        };
    };
};

export enum GigRunState {
    WaitingForInput,
    Running,
    Completed,
}

export enum GigRunResult {
    Success,
    Failure,
}

export type GigRun = K8sResourceCommon & {
    spec: {
        gigRef: {
            name: string;
            containerName?: string;
        };
        form?: {
            spec?: FormSpec;
        }

        parameters?: object;
    };

    status?: {
        result?: GigRunResult;
        runTime?: number;
        startedby?: string;
        state?: GigRunState;
    };
};

class InvalidK8sSingleResourceQueryError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'InvalidK8sSingleResourceQueryError';
    }
}

export function getK8sResources<T extends K8sResourceKind> (
    options: WatchK8sResource = {},
    isList: boolean = true
) {
    options.isList = true;
    let [results, loaded, errorMsg] = useK8sWatchResource<T[]>(options);

    if (!isList) {
        if (results?.length > 1) {
            throw new InvalidK8sSingleResourceQueryError('Invalid query for a single resource');
        }
        return [results?.length > 0 ? results[0] : null, loaded, errorMsg];
    }

    errorMsg = (loaded || errorMsg?.length) ? errorMsg : 'Unknown Error';
    return [results, loaded, errorMsg];
}

export function getPod (
    options: WatchK8sResource = {}
) {
    options.groupVersionKind = POD_GVK;
    return getK8sResources(options, false);
}

export function getPods (
    options: WatchK8sResource = {}
) {
    options.groupVersionKind = POD_GVK;
    return getK8sResources(options);
}

export function getGigDefinition (
    options: WatchK8sResource = {}
) {
    options.groupVersionKind = GIG_DEFINITION_GVK;
    return getK8sResources<GigDefinition>(options, false);
}

export function getGigDefinitions (
    options: WatchK8sResource = {}
) {
    options.groupVersionKind = GIG_DEFINITION_GVK;
    return getK8sResources<GigDefinition>(options);
}

export function getGig (
    options: WatchK8sResource = {}
) {
    options.groupVersionKind = GIG_GVK;
    return getK8sResources<Gig>(options, false);
}

export function getGigs (
    options: WatchK8sResource = {}
) {
    options.groupVersionKind = GIG_GVK;
    return getK8sResources<Gig>(options);
}

export function getGigRun(
    options: WatchK8sResource = {}
) {
    options.groupVersionKind = GIG_RUN_GVK;
    return getK8sResources<GigRun>(options, false);
}

export function getGigRuns(
    options: WatchK8sResource = {}
) {
    options.groupVersionKind = GIG_RUN_GVK;
    return getK8sResources<GigRun>(options);
}