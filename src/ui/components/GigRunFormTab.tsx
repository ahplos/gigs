import * as React from 'react';
import {
    K8sResourceKind,
    useK8sWatchResource
} from '@openshift-console/dynamic-plugin-sdk';
// consoleFetchJSON [console-dynamic-plugin-sdk/src/utils/fetch/console-fetch.ts]
import {
    Banner,
    TabContent,
    TabContentBody
}  from '@patternfly/react-core';

import GigDefinitionForm from './GigDefinitionForm';

export default function GigRunFormTab(model, page, component) {

    let gig;
    let gigDef;
    let gigDefLoaded;
    let gigDefLoadError;

    if (model.obj.kind == 'Gig') {
        gig = model.obj
        const [gigDefRef, gdLoaded, gdLoadError] = useK8sWatchResource<K8sResourceKind>({
            groupVersionKind: {
                version: 'v1beta1',
                group: 'batch.teknetes.org',
                kind: 'GigDefinition',
            },
            name: gig.spec.gigDefinitionRef.name
        });

        gigDef = gigDefRef;
        gigDefLoaded = gdLoaded;
        gigDefLoadError = gdLoadError ?? 'Unknown Error';
    }
    else {
        gigDef = structuredClone(model.obj);
        gigDefLoaded = true;
    }

    const submissionAction = (formState: any) => {
        if (gig) {
            alert("Starting Job");
        }
        else {
            alert("Preview ONLY");
        }
    }

    let bodyContent = gigDef && gigDefLoaded ?
        <GigDefinitionForm gigDefinition={gigDef} submissionAction={submissionAction} /> :
        <Banner color="red">{gigDefLoadError}</Banner>

    return (
        <TabContent id="run-job-tab">
            <TabContentBody hasPadding>
                { bodyContent }
            </TabContentBody>
        </TabContent>
    );
};