import * as React from 'react';

import { useNavigate } from 'react-router-dom-v5-compat';

import {
    Banner,
    Bullseye,
    Spinner,
    PageSection
} from '@patternfly/react-core';

import GigRunLogViewer from './GigRunLogViewer';

import { GigRun, GigRunState } from '../utilities/objectDefs';

import GigK8sUtils from '../utilities/gigK8sUtils';

const GigRunLogsTab = (model) => {
    const gigRun: GigRun = model.obj;
    const [gigRunState, setGigRunState] = React.useState<GigRunState>();
    const navigate = useNavigate();

    let runState = gigRun?.spec?.runState;
    if (runState) {
        console.log(/==================== WE'RE OVERDOING IT/);
        const currentState = GigRunState[runState]
        if (!gigRunState) {
            setGigRunState(currentState);
        }
        else if (currentState != gigRunState) {
            let path = '/k8s/ns/' + gigRun.metadata.namespace + '/batch.teknetes.org~v1beta1~GigRun/' + gigRun.metadata.name + '/gigrun-input-form';
            navigate(path);
        }
    }

    const JOB_NAME_SELECTOR = 'batch.kubernetes.io/job-name';
    const [pod, _, errorMessage] = GigK8sUtils.getPod({
        namespace: gigRun.metadata.namespace,
        selector: {
            matchLabels: {
                [JOB_NAME_SELECTOR]: gigRun.metadata.labels[JOB_NAME_SELECTOR],
            },
        },
    });

    let bodyContent = <Bullseye><Spinner size='lg' aria-label='Fetching logs...' /></Bullseye>;
    if (pod) {
        bodyContent = <GigRunLogViewer gigRun={gigRun} pod={pod} />;
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