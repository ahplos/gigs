import * as React from 'react';

import {
    Banner,
    TabContent,
    TabContentBody
}  from '@patternfly/react-core';

import GigDefinitionForm from './GigDefinitionForm';

import { getGigDefinition, GIG_GVK } from '../utilities/objectDefs';

import { createGigRun } from '../utilities/createGigRun'

const GigRunFormTab = (model) => {
    let gig;
    let formSpec = [];
    let objectLoaded = false;
    let objectLoadError: string;

    if (model.obj.kind == GIG_GVK.kind) {
        gig = model.obj
        const [gigDefRef, gdLoaded, gdLoadError] = getGigDefinition(gig.spec.gigDefinitionRef.name)

        formSpec = gigDefRef?.spec?.formSpec ?? [];
        objectLoaded = gdLoaded;
        objectLoadError = gdLoadError ?? 'Unknown Error';
    }
    else {
        formSpec = structuredClone(model.obj.spec.formSpec ?? []);
        objectLoaded = true;
    }

    const submissionAction = (formState: any) => {
        if (gig) {
            createGigRun(gig, formState);
        }
        else {
            alert("Preview ONLY");
        }
    }

    let bodyContent = objectLoaded ?
        <GigDefinitionForm formSpec={formSpec} submissionAction={submissionAction} /> :
        <Banner color="red">ERROR: {objectLoadError}</Banner>

    return (
        <TabContent id="run-job-tab">
            <TabContentBody hasPadding>
                { bodyContent }
            </TabContentBody>
        </TabContent>
    );
};

export default GigRunFormTab;