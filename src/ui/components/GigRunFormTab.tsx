import * as React from 'react';

import {
    Banner,
    Bullseye,
    Spinner,
    TabContent,
    TabContentBody
}  from '@patternfly/react-core';

import GigDefinitionForm from './GigDefinitionForm';

import {
    getGigDefinition,
    Gig,
    GigDefinition,
    GIG_GVK
} from '../utilities/objectDefs';

import {
    createGigRun,
} from '../utilities/createGigRun';

const GigRunFormTab = (model) => {
    let gig: Gig;
    let formSpec = [];
    let gigDefRef: GigDefinition;
    let errorMessage: string;

    if (model.obj.kind == GIG_GVK.kind) {
        gig = model.obj
        const [gd, _, gdLoadError] = getGigDefinition({name: gig.spec.gigDefinitionRef.name});

        gigDefRef = gd;
        formSpec = gigDefRef?.spec?.formSpec ?? [];
        errorMessage = gdLoadError;
    }
    else {
        formSpec = structuredClone(model.obj.spec.formSpec ?? []);
        gigDefRef = model.obj;
    }

    const submissionAction = (formState: any) => {
        if (gig) {
            createGigRun(gig, formState);
        }
        else {
            alert("Preview ONLY");
        }
    }

    let bodyContent;
    if (gigDefRef) {
        bodyContent = <GigDefinitionForm formSpec={formSpec} submissionAction={submissionAction}/>;
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