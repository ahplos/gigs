import {
  K8sResourceCommon,
  K8sResourceKind,
  useK8sWatchResource
} from '@openshift-console/dynamic-plugin-sdk';


export const nsGroupVersionKind = { kind: 'Namespace', version: 'v1' };
export const cronJobGroupVersionKind = { group: 'batch', version: 'v1', kind: 'CronJob' };
export const gigGroupVersionKind = { group: 'batch.teknetes.org', version: 'v1beta1', kind: 'Gig' }
export const gigDefinitionGroupVersionKind = { group: 'batch.teknetes.org', version: 'v1beta1', kind: 'GigDefinition' }
export const gigRunGroupVersionKind = { group: 'batch.teknetes.org', version: 'v1beta1', kind: 'GigRun' }

export type GigDefinition = K8sResourceCommon & {
    spec: {
        formSpec?: { 
            var: string;
            components: {
                inputType: string;
            }[];
        }[];
    }
}

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
        lastRunBy?: {
          account: string;
          startTime: string;
          result: string;
        };
    };
}

export type GigRun = K8sResourceCommon & {
    spec: {
    };
    status: {
    };
}

export function getCronJob(name: string, namespace: string) {
    return useK8sWatchResource<K8sResourceKind>({
            groupVersionKind: cronJobGroupVersionKind,
            name: name,
            namespace: namespace
        });
}

export function getGig(name: string, namespace: string) {
    return useK8sWatchResource<K8sResourceKind>({
            groupVersionKind: gigGroupVersionKind,
            name: name,
            namespace: namespace
        });
}

export function getGigDefinition(name: string) {
    return useK8sWatchResource<K8sResourceKind>({
            groupVersionKind: gigDefinitionGroupVersionKind,
            name: name
        });
}

export function getGigRun(name: string, namespace: string) {
    return useK8sWatchResource<K8sResourceKind>({
            groupVersionKind: gigRunGroupVersionKind,
            name: name,
            namespace: namespace
        });
}