import {
    k8sCreate,
    k8sDelete,
    K8sModel,
    k8sUpdate,
    K8sResourceKind,
    useK8sWatchResource,
    WatchK8sResource
} from '@openshift-console/dynamic-plugin-sdk';

import {
    GIG_MODULE_GVK,
    GIG_FORM_GVK,
    GIG_GVK,
    GIG_RUN_GVK,
    Gig,
    GigModule,
    GigForm,
    GigRun,
    GigRunState,
    JOB_GVK,
    POD_GVK
} from './objectDefs'

export class InvalidK8sSingleResourceQueryError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'InvalidK8sSingleResourceQueryError';
    }
}

export default class GigK8sUtils {

    private static readonly gigRunModel: K8sModel = {
        abbr: 'GR',
        apiGroup: 'batch.ahplos.org',
        apiVersion: 'v1beta1',
        crd: true,
        id: 'gigrun',
        kind: 'GigRun',
        label: 'GigRun',
        labelKey: 'ahplos-gigs-plugin~GigRun',
        labelPlural: 'GigRuns',
        labelPluralKey: 'ahplos-gigs-plugin~GigRuns',
        namespaced: true,
        plural: 'gigruns',
        propagationPolicy: 'Background',
    };

    private static getK8sResource<T extends K8sResourceKind> (
        options: WatchK8sResource = {},
    ) {
        let [results, loaded, errorMsg] = useK8sWatchResource<T>(options);

        return [results as T, loaded, errorMsg];
    }

    private static getK8sResources<T extends K8sResourceKind[]> (
        options: WatchK8sResource = {},
    ) {
        let [results, loaded, errorMsg] = useK8sWatchResource<T>(options);

        return [results as T, loaded, errorMsg];
    }

    public static createGigRun(gig: Gig, inputValues: object): Promise<GigRun> {
        const gigRun: GigRun = {
            apiVersion: 'batch.ahplos.org/v1beta1',
            kind: 'GigRun',
            metadata: {
                generateName: gig.metadata.name + '-',
                namespace: gig.metadata.namespace
            },
            spec: {
                gigRef: {
                    name: gig.metadata.name
                },
                inputReceived: false,
                inputValues: JSON.stringify(inputValues)
            }
        };

        return k8sCreate({model: GigK8sUtils.gigRunModel, data: gigRun})
    };

    public static deleteGigRun (obj) {
        const options = {
            model: this.gigRunModel,
            resource: obj,
        }
        return k8sDelete(options);
    }

    public static getJob (
        options: WatchK8sResource = {}
    ) {
        options.groupVersionKind = JOB_GVK;
        return GigK8sUtils.getK8sResource(options);
    }

    public static getPod (
        options: WatchK8sResource = {}
    ) {
        options.groupVersionKind = POD_GVK;
        return GigK8sUtils.getK8sResource(options);
    }

    public static getPods (
        options: WatchK8sResource = {}
    ) {
        options.groupVersionKind = POD_GVK;
        options.isList = true;
        return GigK8sUtils.getK8sResources(options);
    }

    public static getGigModule (
        options: WatchK8sResource = {}
    ) {
        options.groupVersionKind = GIG_MODULE_GVK;
        return GigK8sUtils.getK8sResource<GigModule>(options);
    }

    public static getGigModules (
        options: WatchK8sResource = {}
    ) {
        options.groupVersionKind = GIG_MODULE_GVK;
        options.isList = true;
        return GigK8sUtils.getK8sResources<GigModule[]>(options);
    }

    public static getGigForm (
        options: WatchK8sResource = {}
    ) {
        options.groupVersionKind = GIG_FORM_GVK;
        return GigK8sUtils.getK8sResource<GigForm>(options);
    }

    public static getGigForms (
        options: WatchK8sResource = {}
    ) {
        options.groupVersionKind = GIG_FORM_GVK;
        options.isList = true;
        return GigK8sUtils.getK8sResources<GigForm[]>(options);
    }

    public static getGig (
        options: WatchK8sResource = {}
    ) {
        options.groupVersionKind = GIG_GVK;
        return GigK8sUtils.getK8sResource<Gig>(options);
    }

    public static getGigs (
        options: WatchK8sResource = {}
    ) {
        options.groupVersionKind = GIG_GVK;
        options.isList = true;
        return GigK8sUtils.getK8sResources<Gig[]>(options);
    }

    public static getGigRun(
        options: WatchK8sResource = {}
    ) {
        options.groupVersionKind = GIG_RUN_GVK;
        return GigK8sUtils.getK8sResource<GigRun>(options);
    }

    public static getGigRuns(
        options: WatchK8sResource = {}
    ) {
        options.groupVersionKind = GIG_RUN_GVK;
        options.isList = true;
        return GigK8sUtils.getK8sResources<GigRun[]>(options);
    }

    public static patchGigRunInputValues = (gigRun: GigRun, inputValues: object): Promise<GigRun> => {
        gigRun.spec.inputValues = JSON.stringify(inputValues)
        gigRun.spec.inputReceived = true

        return k8sUpdate({model: GigK8sUtils.gigRunModel, data: gigRun})
    };

    public static patchGigRunRunState = (gigRun: GigRun, state: GigRunState): Promise<GigRun> => {
        gigRun.spec.runState = state

        return k8sUpdate({model: GigK8sUtils.gigRunModel, data: gigRun})
    };
}
