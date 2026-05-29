import * as React from 'react';

import { useNavigate } from 'react-router-dom-v5-compat';

import {
    TabContent,
    TabContentBody
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
        GigK8sUtils.patchGigRunInputValues(gigRun, formState);

        let path = '/k8s/ns/' + gigRun.metadata.namespace + '/batch.ahplos.org~v1beta1~GigRun/' + gigRun.metadata.name + '/gigrun-log-viewer';
        navigate(path);
    }

    const abortAction = () => {
        GigK8sUtils.patchGigRunRunState(gigRun, GigRunState.Aborting);

        let path = '/k8s/ns/' + gigRun.metadata.namespace + '/batch.ahplos.org~v1beta1~GigRun/' + gigRun.metadata.name + '/gigrun-log-viewer';
        navigate(path);
    }

    let formType = (gigRun?.spec?.runState == GigRunState.WaitingForInput) ? GigFormType.WAITING_FOR_INPUT : null;
    let title = formType && gigRun.spec.formTitle ?
        <GigTitle title={gigRun.spec.formTitle.title} headingLevel={gigRun.spec.formTitle.headingLevel}/> : <></>

    return (
        <>
            <TabContent id="input-gigrun-tab">
                <TabContentBody hasPadding>
                    {title}
                    <GigInputForm formSpec={formSpec} submissionAction={submissionAction} abortAction={abortAction} formType={formType} />
                </TabContentBody>
            </TabContent>
        </>
    );
};

export default GigRunInputTab;