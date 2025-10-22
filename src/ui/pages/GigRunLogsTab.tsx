import * as React from 'react';

import { useNavigate } from 'react-router-dom-v5-compat';

import {
    Banner,
    Bullseye,
    Spinner,
    PageSection
} from '@patternfly/react-core';

import GigRunLogViewer from '../components/GigRunLogViewer';

import { GigRun, GigRunState } from '../utilities/objectDefs';

import GigK8sUtils from '../utilities/gigK8sUtils';

export const GigRunLogsTab = (model) => {
    const gigRun: GigRun = model.obj;
    const [gigRunState, setGigRunState] = React.useState<GigRunState>(gigRun?.spec?.runState);
    const navigate = useNavigate();

    let runState = gigRun?.spec?.runState;
    if (runState) {
        const currentState = GigRunState[runState]

        if (currentState != gigRunState) {
            setGigRunState(currentState);
            if (currentState == GigRunState.WaitingForInput) {
                let path = '/k8s/ns/' + gigRun.metadata.namespace + '/batch.ahplos.org~v1beta1~GigRun/' + gigRun.metadata.name + '/gigrun-input-form';
                navigate(path);
            }
        }
    }

    const JOB_NAME_SELECTOR = 'batch.kubernetes.io/job-name';
    const [pods, _, errorMessage] = GigK8sUtils.getPods({
        namespace: gigRun.metadata.namespace,
        selector: {
            matchLabels: {
                [JOB_NAME_SELECTOR]: gigRun.metadata.labels[JOB_NAME_SELECTOR],
            },
        },
    });

    let bodyContent = <Bullseye><Spinner size='lg' aria-label='Fetching logs...' /></Bullseye>;
    if ((pods?.length ?? 0) > 0) {
        bodyContent = <GigRunLogViewer gigRun={gigRun} pod={pods[0]} />;
    }
    else if (errorMessage?.length > 0) {
        bodyContent = <Banner variant='red'>ERROR: {errorMessage}</Banner>;
    }

    return (
        <PageSection isFilled style={{ background: 'rgba(200, 54, 54, 0)' }}>
            {bodyContent}
        </PageSection>
    );
};

export default GigRunLogsTab;