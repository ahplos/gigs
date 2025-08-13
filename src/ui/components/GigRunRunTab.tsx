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

const GigRunFormTab = (model) => {
    const gigRun: GigRun = model.obj;
    const formSpec: any = structuredClone(gigRun.spec?.form?.spec ?? []);

    const submissionAction = (formState: any) => {
        if (formState) {
            alert("Should submit values and continue");
        }
        else {
            alert("Approval gate; Should continue");
        }
    }

    let bodyContent = <Bullseye><Spinner size='lg' aria-label='Fetching logs...' /></Bullseye>;

    const JOB_NAME_SELECTOR = 'batch.kubernetes.io/job-name';
    const jobNamePresent = JOB_NAME_SELECTOR in (gigRun?.metadata.labels ?? {});
    if (jobNamePresent) {
        bodyContent = (gigRun?.status?.state == GigRunState.WaitingForInput) ?
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