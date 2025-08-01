import {
    K8sGroupVersionKind,
    K8sResourceCommon,
    K8sResourceKind,
    useK8sWatchResource,
    useK8sWatchResources
} from '@openshift-console/dynamic-plugin-sdk';

export const NS_GVK: K8sGroupVersionKind = { kind: 'Namespace', version: 'v1' };
export const CRONJOB_GVK: K8sGroupVersionKind = { group: 'batch', version: 'v1', kind: 'CronJob' };
export const POD_GVK: K8sGroupVersionKind = { group: '', version: 'v1', kind: 'Pod' };

export const GIG_GVK: K8sGroupVersionKind = {
    group: 'batch.teknetes.org',
    version: 'v1beta1',
    kind: 'Gig',
};
export const GIG_DEFINITION_GVK: K8sGroupVersionKind = {
    group: 'batch.teknetes.org',
    version: 'v1beta1',
    kind: 'GigDefinition',
};

export const GIG_RUN_GVK: K8sGroupVersionKind = {
    group: 'batch.teknetes.org',
    version: 'v1beta1',
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
        formSpec?: FormSpec[];
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

export enum GigRunState {
    WaitingForUserInput,
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
        formSpec?: FormSpec;
        inputParams?: object;
    };

    status?: {
        result?: GigRunResult;
        runTime?: number;
        startedBy?: string;
        state?: GigRunState;
    };
};

export type TypeList<T> = {
    apiVersion: string;
    kind: string;
    items: T[];

}

export function getK8sResource<T extends K8sResourceKind> (
    options: {
        groupVersionKind: K8sGroupVersionKind,
        name?: string,
        namespace?: string,
        selectors?: {}
        matchExpressions?: []
    }
) {
    return useK8sWatchResource<T>({
        groupVersionKind: options.groupVersionKind,
        name: options.name,
        namespace: options.namespace,
        selector: {
            matchLabels: options.selectors,
            matchExpressions: options.matchExpressions
        }
    });
}

export function getK8sResources<T> (
    options: {
        groupVersionKind: K8sGroupVersionKind,
        name?: string,
        namespace?: string,
        selectors?: {}
        matchExpressions?: []
    }
) {
    let watchResources = useK8sWatchResources<{watchResources: TypeList<T>}>({
        watchResources: {
            groupVersionKind: options.groupVersionKind,
            name: options.name,
            namespace: options.namespace,
            selector: {
                matchLabels: options.selectors,
                matchExpressions: options.matchExpressions
            }
        }
    });

    let resources = watchResources.watchResources
    return [resources?.data?.items ?? [], resources?.loaded ?? false, resources?.loadError ?? 'Unknown Error'];
}

export function getCronJob (
    options: {
        name: string,
        namespace?: string,
        selectors?: {},
        matchExpressions?: []
    }
) {
    return getK8sResource({
        groupVersionKind: CRONJOB_GVK,
        name: options.name,
        namespace: options.namespace,
        selectors: options.selectors,
        matchExpressions: options.matchExpressions
    });
}

export function getCronJobs (
    options: {
        name?: string,
        namespace?: string,
        selectors?: {},
        matchExpressions?: []
    } = {}
) {
    return getK8sResources({
        groupVersionKind: CRONJOB_GVK,
        ...options
    });
}

export function getPod (
    options: {
        name: string,
        namespace?: string,
        selectors?: {},
        matchExpressions?: []
    }
) {
    return getK8sResource({
        groupVersionKind: POD_GVK,
        ...options
    });
}

export function getPods (
    options: {
        name?: string,
        namespace?: string,
        selectors?: {},
        matchExpressions?: []
    } = {}
) {
    return getK8sResources({
        groupVersionKind: POD_GVK,
        ...options
    });
}

export function getGigDefinition (
    options: {
        name: string,
        selectors?: {},
        matchExpressions?: []
    }
) {
    return getK8sResource<GigDefinition>({
        groupVersionKind: GIG_DEFINITION_GVK,
        ...options
    });
}

export function getGigDefinitions (
    options: {
        name?: string,
        selectors?: {},
        matchExpressions?: []
    } = {}
) {
    return getK8sResources<GigDefinition>({
        groupVersionKind: GIG_DEFINITION_GVK,
        ...options
    });
}

export function getGig (
    options: {
        name: string,
        namespace?: string,
        selectors?: {},
        matchExpressions?: []
    }
) {
    return getK8sResource<Gig>({
        groupVersionKind: GIG_GVK,
        ...options
    });
}

export function getGigs (
    options: {
        name?: string,
        namespace?: string,
        selectors?: {},
        matchExpressions?: []
    } = {}
) {
    return getK8sResources<Gig>({
        groupVersionKind: GIG_GVK,
        ...options
    });
}

export function getGigRun(
    options: {
        name: string,
        namespace?: string,
        selectors?: {},
        matchExpressions?: []
    }
) {
    return getK8sResource<GigRun>({
        groupVersionKind: GIG_RUN_GVK,
        ...options
    });
}

export function getGigRuns(
    options: {
        name?: string,
        namespace?: string,
        selectors?: {},
        matchExpressions?: []
    } = {}
) {
    return getK8sResources<GigRun>({
        groupVersionKind: GIG_RUN_GVK,
        ...options
    });
}