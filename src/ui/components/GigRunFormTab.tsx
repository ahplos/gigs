import * as React from 'react';
import {
    useK8sWatchResource
} from '@openshift-console/dynamic-plugin-sdk';
// consoleFetchJSON [console-dynamic-plugin-sdk/src/utils/fetch/console-fetch.ts]
import {
    Banner,
    TabContent,
    TabContentBody
}  from '@patternfly/react-core';

import GigDefinitionForm from './GigDefinitionForm';

import { GigDefinition } from '../utilities/objectDefs';

export default function GigRunFormTab(model, page, component) {

    let name;
    let formSpec;
    let objectLoaded;
    let objectLoadError;
    let previewOnly = false;

    switch (model.obj.kind) {
        case 'Gig':
            const [gigDefRef, gdLoaded, gdLoadError] = useK8sWatchResource<GigDefinition>({
                groupVersionKind: {
                    version: 'v1beta1',
                    group: 'batch.teknetes.org',
                    kind: 'GigDefinition',
                },
                name: model.obj.spec.gigDefinitionRef.name
            });

            name = gigDefRef.spec.name;
            formSpec = gigDefRef.spec.formSpec;
            objectLoaded = gdLoaded;
            objectLoadError = gdLoadError ?? 'Unknown Error';
        case 'GigRun':
            if (!model.obj.spec.formSpec) {
            }
        case 'GigDefinition':
            let gigDef = structuredClone(model.obj)
            name = gigDef.spec.name;
            formSpec = gigDef.spec.formSpec;
            objectLoaded = true;
            previewOnly = true;
    }


    const submissionAction = (formState: any) => {
        if (previewOnly) {
            alert("Starting Job");
        }
        else {
            alert("Preview ONLY");
        }
    }

    let bodyContent = formSpec && objectLoaded ?
        <GigDefinitionForm formName={name ?? 'GigRun Form'}
                           formSpec={formSpec}
                           submissionAction={submissionAction} /> :
        <Banner color="red">{objectLoadError}</Banner>

    return (
        <TabContent id="run-job-tab">
            <TabContentBody hasPadding>
                { bodyContent }
            </TabContentBody>
        </TabContent>
    );
};