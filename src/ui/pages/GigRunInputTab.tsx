import * as React from 'react';

import { useNavigate } from 'react-router-dom-v5-compat';

import {
    PageSection,
} from '@patternfly/react-core';

import {
    GigInputForm,
    GigFormType,
    GigTitle,
} from '../gigUiComponents';

import {
    GigRun,
    GigRunState
} from '../utilities/objectDefs';

import GigK8sUtils from '../utilities/gigK8sUtils';

export const GigRunInputTab = (model) => {
    const gigRun: GigRun = model.obj;
    const formSpec: any = structuredClone(gigRun.spec?.inputForm ?? []);
    const navigate = useNavigate();

    const submissionAction = (formState: any) => {
        let aborting: boolean = formState && formState['__ABORT_ABORT_ABORT']
        if (formState && !aborting) {
            GigK8sUtils.patchGigRunInputValues(gigRun, formState);
        }
        else {
            GigK8sUtils.patchGigRunRunState(gigRun, aborting ? GigRunState.Aborting : GigRunState.Running);
        }

        let path = '/k8s/ns/' + gigRun.metadata.namespace + '/batch.ahplos.org~v1beta1~GigRun/' + gigRun.metadata.name + '/gigrun-log-viewer';
        navigate(path);
    }

    let formType = (gigRun?.spec?.runState == GigRunState.WaitingForInput) ? GigFormType.WAITING_FOR_INPUT : null;
    let title = formType && gigRun.spec.formTitle ?
        <GigTitle title={gigRun.spec.formTitle.title} headingLevel={gigRun.spec.formTitle.headingLevel}/> : <></>

    return (
        <>
            <PageSection isFilled style={{ background: 'rgba(200, 54, 54, 0)' }}>
                {title}
                <GigInputForm formSpec={formSpec} submissionAction={submissionAction} formType={formType} />
            </PageSection>
        </>
    );
};

export default GigRunInputTab;