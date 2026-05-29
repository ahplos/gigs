import * as React from 'react';

import {
    Banner,
    Bullseye,
    Spinner,
    TabContent,
    TabContentBody,
}  from '@patternfly/react-core';

import { useNavigate } from 'react-router-dom-v5-compat';

import {
    GigInputForm,
    GigFormType,
    GigTitle,
} from '../gigUiComponents';

import {
    Gig,
    GigForm,
    GIG_GVK,
} from '../utilities/objectDefs';

import GigK8sUtils from '../utilities/gigK8sUtils';

export const GigRunFormTab = (model) => {
    let gig: Gig;
    let gigForm: GigForm;
    let formSpec = [];
    let errorMessage: string;

    if (model.obj.kind == GIG_GVK.kind && model.obj.spec.gigFormRef) {
        gig = model.obj

        const [gf, _, gfLoadError] = GigK8sUtils.getGigForm({
            name: gig.spec.gigFormRef?.name,
            namespace: gig.spec.gigFormRef.namespace ?? gig.metadata.namespace
        });

        gigForm = gf;
        formSpec = gigForm?.spec?.inputForm ?? [];
        errorMessage = gfLoadError;
    }
    else if (model.spec.inputForm) {
        gigForm = model.obj
        formSpec = structuredClone(gigForm.spec.inputForm ?? []);
    }

    const navigate = useNavigate();

    const submissionAction = (formState: any) => {
        GigK8sUtils.createGigRun(gig, formState)
            .then((gigRun) => {
                let path = '/k8s/ns/' + gigRun.metadata.namespace + '/batch.ahplos.org~v1beta1~GigRun/' + gigRun.metadata.name + '/gigrun-log-viewer';
                navigate(path);
            })
            .catch((e) => {
                console.log(e);
            });
    }

    let bodyContent;
    if (formSpec) {
        const gigFormType = gig ? GigFormType.START : GigFormType.PREVIEW;
        bodyContent = <GigInputForm formSpec={formSpec} submissionAction={submissionAction} abortAction={null} formType={gigFormType} />;
    }
    else if (errorMessage) {
        bodyContent = <Banner color="red">ERROR: {errorMessage}</Banner>;
    }
    else {
        bodyContent = <Bullseye><Spinner size="lg" aria-label="Rendering form..." /></Bullseye>;
    }

    let title = gigForm?.spec?.formTitle ?
        <GigTitle title={gigForm.spec.formTitle.title} headingLevel={gigForm.spec.formTitle.headingLevel}/> : <></>

    return (
        <TabContent id="run-job-tab">
            <TabContentBody hasPadding>
                { title }
                { bodyContent }
            </TabContentBody>
        </TabContent>
    );
};

export default GigRunFormTab;