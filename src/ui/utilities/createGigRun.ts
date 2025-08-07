import {
    k8sCreate,
    K8sModel,
} from '@openshift-console/dynamic-plugin-sdk';

import { Gig, GigRun } from './objectDefs';

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
            inputParams: {
            }
        }
    };

    for (const [key, value] of Object.entries(formState)) {
        if (key) {
            gigRun['spec']['inputParams'][key] = value;
        }
    };
    console.log('GigRun defined: ' + JSON.stringify(gigRun));

    return k8sCreate({model: gigRunModel, data: gigRun})
};