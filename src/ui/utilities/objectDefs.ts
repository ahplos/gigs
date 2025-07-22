import {
    K8sResourceCommon,
    K8sResourceKind,
    useK8sWatchResource,
} from "@openshift-console/dynamic-plugin-sdk";

export const NS_GVK = { kind: "Namespace", version: "v1" };
export const CRONJOB_GVK = { group: "batch", version: "v1", kind: "CronJob" };
export const GIG_GVK = {
    group: "batch.teknetes.org",
    version: "v1beta1",
    kind: "Gig",
};
export const GIG_DEFINITION_GVK = {
    group: "batch.teknetes.org",
    version: "v1beta1",
    kind: "GigDefinition",
};
export const GIG_RUN_GVK = {
    group: "batch.teknetes.org",
    version: "v1beta1",
    kind: "GigRun",
};

export const GIG_MAP: Map<string, Gig> = new Map();
export const CURRENT_GIG = "CURRENT_GIG";

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
    metadata: {
        name: string;
        namespace: string;
    };
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

enum GigRunState {
    WaitingForUserInput,
    Running,
    Completed,
}

enum GigRunResult {
    Success,
    Failure,
}

export type GigRun = K8sResourceCommon & {
    spec: {
        gigRef: {
            name: string;
        };
        formSpec?: FormSpec;
    };

    status: {
        result: GigRunResult;
        runTime: number;
        startedBy: string;
        state: GigRunState;
    };
};

export function getCronJob(name: string, namespace: string) {
    return useK8sWatchResource<K8sResourceKind>({
        groupVersionKind: CRONJOB_GVK,
        name: name,
        namespace: namespace,
    });
}

export function getGig(
    name: string,
    namespace: string
): [Gig, boolean, string] {
    return useK8sWatchResource<Gig>({
        groupVersionKind: GIG_GVK,
        name: name,
        namespace: namespace,
    });
}

export function getGigs(namespace: string = null): [Gig[], boolean, string] {
    return useK8sWatchResource<Gig[]>({
        groupVersionKind: GIG_GVK,
        namespace: namespace,
        isList: true,
        namespaced: true,
    });
}

export function getGigDefinition(
    name: string = null
): [GigDefinition, boolean, string] {
    return useK8sWatchResource<GigDefinition>({
        groupVersionKind: GIG_DEFINITION_GVK,
        isList: false,
        namespaced: false,
        name: name,
    });
}

export function getGigDefinitions(): [GigDefinition[], boolean, string] {
    return useK8sWatchResource<GigDefinition[]>({
        groupVersionKind: GIG_DEFINITION_GVK,
        isList: true,
        namespaced: false,
    });
}

export function getGigRun(
    name: string,
    namespace: string
): [GigRun, boolean, string] {
    return useK8sWatchResource<GigRun>({
        groupVersionKind: GIG_RUN_GVK,
        name: name,
        namespace: namespace,
    });
}

export function getGigRuns(
    namespace: string = null
): [GigRun[], boolean, string] {
    return useK8sWatchResource<GigRun[]>({
        groupVersionKind: GIG_RUN_GVK,
        namespace: namespace,
        isList: true,
        namespaced: true,
    });
}
