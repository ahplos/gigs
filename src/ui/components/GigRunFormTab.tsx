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
    GigDefinitionForm
} from './gigUiComponents';

import {
    getGigDefinition,
    Gig,
    GigRun,
    GigDefinition,
    GIG_GVK,
    GIG_RUN_GVK
} from '../utilities/objectDefs';

import {
    createGigRun,
} from '../utilities/createGigRun';

const GigRunFormTab = (model) => {
    let gig: Gig;
    let gigRun: GigRun;
    let formSpec = [];
    let gigDefRef: GigDefinition;
    let errorMessage: string;

    if (model.obj.kind == GIG_RUN_GVK.kind) {
        gigRun = model.obj;
        formSpec = gigRun?.spec?.form?.spec || [];
    }
    else if (model.obj.kind == GIG_GVK.kind) {
        gig = model.obj
        const [gd, _, gdLoadError] = getGigDefinition({name: gig.spec.gigDefinitionRef.name});

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
        createGigRun(gig, formState)
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
        bodyContent = <GigDefinitionForm formSpec={formSpec} submissionAction={submissionAction} preview={gig ? false : true}/>;
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