import * as React from 'react';

import {
    Banner,
    Bullseye,
    Spinner,
    TabContent,
    TabContentBody
}  from '@patternfly/react-core';

import { useNavigate } from 'react-router-dom-v5-compat';

import {
    GigDefinitionForm,
    GigFormType
} from './gigUiComponents';

import {
    Gig,
    GigDefinition,
    GIG_GVK,
} from '../utilities/objectDefs';

import GigK8sUtils from '../utilities/gigK8sUtils';

const GigRunFormTab = (model) => {
    let gig: Gig;
    let formSpec = [];
    let gigDefRef: GigDefinition;
    let errorMessage: string;

    if (model.obj.kind == GIG_GVK.kind) {
        gig = model.obj
        const [gd, _, gdLoadError] = GigK8sUtils.getGigDefinition({name: gig.spec.gigDefinitionRef.name});

        gigDefRef = gd;
        formSpec = gigDefRef?.spec?.form?.spec ?? [];
        errorMessage = gdLoadError;
    }
    else {
        formSpec = structuredClone(model.obj.spec.form?.spec ?? []);
        gigDefRef = model.obj;
    }

    const navigate = useNavigate();

    const submissionAction = (formState: any) => {
        GigK8sUtils.createGigRun(gig, formState)
            .then((gigRun) => {
                let path = '/k8s/ns/' + gigRun.metadata.namespace + '/batch.teknetes.org~v1beta1~GigRun/' + gigRun.metadata.name + '/gigrun-log-viewer';
                navigate(path);
            })
            .catch((e) => {
                console.log(e);
            });
    }

    let bodyContent;
    if (gigDefRef) {
        const gigFormType = gig? GigFormType.START : GigFormType.PREVIEW;
        bodyContent = <GigDefinitionForm formSpec={formSpec} submissionAction={submissionAction} formType={gigFormType} />;
    }
    else if (errorMessage) {
        bodyContent = <Banner color="red">ERROR: {errorMessage}</Banner>;
    }
    else {
        bodyContent = <Bullseye><Spinner size="lg" aria-label="Rendering form..." /></Bullseye>;
    }

    return (
        <TabContent id="run-job-tab">
            <TabContentBody hasPadding>
                { bodyContent }
            </TabContentBody>
        </TabContent>
    );
};

export default GigRunFormTab;