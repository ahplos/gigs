import * as React from 'react';
import {
    PageSection
}  from '@patternfly/react-core';

import {
    GigDefinitionForm
} from './gigUiComponents';

import GigRunLogViewer from './GigRunLogViewer';

import { GigRun, GigRunState } from '../utilities/objectDefs';

const GigRunFormTab = (model) => {

    const gigRun: GigRun = model.obj;
    const formSpec: any = structuredClone(gigRun.spec?.formSpec ?? []);

    const submissionAction = (formState: any) => {
        if (formState) {
            alert("Should submit values and continue");
        }
        else {
            alert("Approval gate; Should continue");
        }
    }

    let bodyContent = (gigRun?.status?.state == GigRunState.WaitingForUserInput) ?
        <GigDefinitionForm formSpec={formSpec} submissionAction={submissionAction} /> :
        <GigRunLogViewer gigRun={gigRun}/>

    return (
        <PageSection isFilled style={{ background: 'rgba(200, 54, 54, 0)' }}>
            { bodyContent }
        </PageSection>
    );
};

export default GigRunFormTab;