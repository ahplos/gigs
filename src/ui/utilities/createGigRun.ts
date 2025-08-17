import {
    k8sPatch,
    k8sCreate,
    K8sModel,
} from '@openshift-console/dynamic-plugin-sdk';

import { Gig, GigRun, GigRunState } from './objectDefs';

const gigRunModel: K8sModel = {
    abbr: 'GR',
    apiGroup: 'batch.teknetes.org',
    apiVersion: 'v1beta1',
    crd: true,
    id: 'gigrun',
    kind: 'GigRun',
    label: 'GigRun',
    labelKey: 'teknetes-gigs-plugin~GigRun',
    labelPlural: 'GigRuns',
    labelPluralKey: 'teknetes-gigs-plugin~GigRuns',
    namespaced: true,
    plural: 'gigruns',
};

export const createGigRun = (gig: Gig, formStateObj: object): Promise<GigRun> => {
    let formState: any = formStateObj instanceof Map ? Object.fromEntries(formStateObj) : formStateObj;

    const gigRun: GigRun = {
        apiVersion: 'batch.teknetes.org/v1beta1',
        kind: 'GigRun',
        metadata: {
            generateName: gig.metadata.name + '-',
            namespace: gig.metadata.namespace
        },
        spec: {
            gigRef: {
                name: gig.metadata.name
            },
            form: {
                inputvalues: {
                }
            }
        }
    };

    for (const [key, value] of Object.entries(formState)) {
        if (key) {
            gigRun.spec.form.inputvalues[key] = value;
        }
    };

    return k8sCreate({model: gigRunModel, data: gigRun})
};

export const patchGigRunInputValues = (gigRun: GigRun, formStateObj: object): Promise<GigRun> => {
    let formState: any = formStateObj instanceof Map ? Object.fromEntries(formStateObj) : formStateObj;

    const patchData = [
        {
            op: 'replace',
            path: '/spec/form/inputValues',
            values: formState
        },
    ]

    return k8sPatch({model: gigRunModel, resource: gigRun, data: patchData})
};

export const patchGigRunRunState = (gigRun: GigRun): Promise<GigRun> => {
    const patchData = [
        {
            op: 'replace',
            path: '/spec',
            values: {
                runState: GigRunState.Running.valueOf()
            }
        },
    ]

    return k8sPatch({model: gigRunModel, resource: gigRun, data: patchData})
};