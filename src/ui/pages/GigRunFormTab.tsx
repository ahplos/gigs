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
    GigInputForm,
    GigFormType
} from '../gigUiComponents';

import {
    Gig,
    GigLaunchForm,
    GIG_GVK,
} from '../utilities/objectDefs';

import GigK8sUtils from '../utilities/gigK8sUtils';

export const GigRunFormTab = (model) => {
    let gig: Gig;
    let gigLaunchForm: GigLaunchForm;
    let formSpec = [];
    let errorMessage: string;

    if (model.obj.kind == GIG_GVK.kind) {
        gig = model.obj
        const [glf, _, glfLoadError] = GigK8sUtils.getGigLaunchForm({
            name: gig.spec.gigLaunchFormRef.name,
            namespace: gig.spec.gigLaunchFormRef.namespace
        });

        gigLaunchForm = glf;
        formSpec = gigLaunchForm?.spec?.inputForm ?? [];
        errorMessage = glfLoadError;
    }
    else {
        gigLaunchForm = model.obj
        formSpec = structuredClone(gigLaunchForm.spec.inputForm ?? []);
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
    if (gigLaunchForm) {
        const gigFormType = gig ? GigFormType.START : GigFormType.PREVIEW;
        bodyContent = <GigInputForm formSpec={formSpec} submissionAction={submissionAction} formType={gigFormType} />;
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