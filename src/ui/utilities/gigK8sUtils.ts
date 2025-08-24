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
    GIG_DEFINITION_GVK,
    GIG_GVK,
    GIG_RUN_GVK,
    Gig,
    GigDefinition,
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
        propagationPolicy: 'Background',
    };

    private static getK8sResources<T extends K8sResourceKind> (
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

    public static createGigRun(gig: Gig, inputValues: object): Promise<GigRun> {
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
                    inputvalues: {...inputValues}
                }
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
        return GigK8sUtils.getK8sResources(options, false);
    }

    public static getPod (
        options: WatchK8sResource = {}
    ) {
        options.groupVersionKind = POD_GVK;
        return GigK8sUtils.getK8sResources(options, false);
    }

    public static getPods (
        options: WatchK8sResource = {}
    ) {
        options.groupVersionKind = POD_GVK;
        return GigK8sUtils.getK8sResources(options);
    }

    public static getGigDefinition (
        options: WatchK8sResource = {}
    ) {
        options.groupVersionKind = GIG_DEFINITION_GVK;
        return GigK8sUtils.getK8sResources<GigDefinition>(options, false);
    }

    public static getGigDefinitions (
        options: WatchK8sResource = {}
    ) {
        options.groupVersionKind = GIG_DEFINITION_GVK;
        return GigK8sUtils.getK8sResources<GigDefinition>(options);
    }

    public static getGig (
        options: WatchK8sResource = {}
    ) {
        options.groupVersionKind = GIG_GVK;
        return GigK8sUtils.getK8sResources<Gig>(options, false);
    }

    public static getGigs (
        options: WatchK8sResource = {}
    ) {
        options.groupVersionKind = GIG_GVK;
        return GigK8sUtils.getK8sResources<Gig>(options);
    }

    public static getGigRun(
        options: WatchK8sResource = {}
    ) {
        options.groupVersionKind = GIG_RUN_GVK;
        return GigK8sUtils.getK8sResources<GigRun>(options, false);
    }

    public static getGigRuns(
        options: WatchK8sResource = {}
    ) {
        options.groupVersionKind = GIG_RUN_GVK;
        return GigK8sUtils.getK8sResources<GigRun>(options);
    }

    public static patchGigRunInputValues = (gigRun: GigRun, inputValues: object): Promise<GigRun> => {
        gigRun.spec.form.inputvalues = {...inputValues}

        return k8sUpdate({model: GigK8sUtils.gigRunModel, data: gigRun})
    };

    public static patchGigRunRunState = (gigRun: GigRun, aborting: boolean): Promise<GigRun> => {
        gigRun.spec.runState = aborting ? GigRunState.Aborting : GigRunState.Running

        return k8sUpdate({model: GigK8sUtils.gigRunModel, data: gigRun})
    };
}
