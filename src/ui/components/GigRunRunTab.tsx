import * as React from 'react';
import {
    Bullseye,
    Spinner,
    PageSection
} from '@patternfly/react-core';

import {
    GigDefinitionForm
} from './gigUiComponents';

import GigRunLogViewer from './GigRunLogViewer';

import { GigRun, GigRunState } from '../utilities/objectDefs';

import {
    patchGigRunInputValues,
    patchGigRunRunState
} from '../utilities/createGigRun';

const GigRunFormTab = (model) => {
    const gigRun: GigRun = model.obj;
    const formSpec: any = structuredClone(gigRun.spec?.form?.spec ?? []);

    const submissionAction = (formState: any) => {
        if (formState) {
            patchGigRunInputValues(gigRun, formState);
        }
        else {
            patchGigRunRunState(gigRun);
        }
    }

    let bodyContent = <Bullseye><Spinner size='lg' aria-label='Fetching logs...' /></Bullseye>;

    const JOB_NAME_SELECTOR = 'batch.kubernetes.io/job-name';
    const jobNamePresent = JOB_NAME_SELECTOR in (gigRun?.metadata.labels ?? {});
    if (jobNamePresent) {
        let waitingForInput = GigRunState.WaitingForInput.valueOf();
        bodyContent = (gigRun?.spec?.runState == waitingForInput) ?
            <GigDefinitionForm formSpec={formSpec} submissionAction={submissionAction} gigRun /> :
            <GigRunLogViewer gigRun={gigRun} />
    }

    return (
        <PageSection isFilled style={{ background: 'rgba(200, 54, 54, 0)' }}>
            {bodyContent}
        </PageSection>
    );
};

export default GigRunFormTab;