import * as React from 'react';
import {
    consoleFetchJSON,
    K8sResourceKind,
    useK8sWatchResource
} from '@openshift-console/dynamic-plugin-sdk';
// consoleFetchJSON [console-dynamic-plugin-sdk/src/utils/fetch/console-fetch.ts]
import {
    Banner,
    TabContent,
    TabContentBody
}  from '@patternfly/react-core';

import TeknetesForm from '../utilities/TeknetesForm';

import createJob from '../utilities/createJob';

export default function TeknetesJobLaunchTab(model, page, component) {
    const [pageRefresh, setPageRefresh] = React.useState(true)

    let cronJob = model.obj;
    let teknetesFormName = cronJob?.metadata?.annotations['ui.teknetes.org/form'];

    const [teknetesForm, loaded, loadError] = teknetesFormName ? useK8sWatchResource<K8sResourceKind>({
        groupVersionKind: {
            version: 'v1beta1',
            group: 'ui.teknetes.org',
            kind: 'TeknetesForm',
        },
        name: teknetesFormName
    }) : [{}, true, false];

    let teknetesFormMutable = null

    if (!loaded || loadError) {
        return (
            <Banner color="red">Launch Form {teknetesFormName} not found or unable to load</Banner>
        );
    }

    const submissionAction = (formState: any) => {
        if (!teknetesFormMutable) {
            createJob(model.obj, formState);
        }

        let url = 'v1/namespaces/default/pods/single-wrong-arch/exec'
        let options = `curl http://localhost:8080 -ksS -H 'Accept application/json' -d ${JSON.stringify(formState)}`
        
        teknetesFormMutable = consoleFetchJSON(url, options)
            .then((response) => {
                teknetesFormMutable = response ?? {};
            })
            .catch((e) => console.error(e));

        setPageRefresh(!pageRefresh);
    }

    return (
        <TabContent id="run-job-tab">
            <TabContentBody hasPadding>
                <TeknetesForm teknetesForm={teknetesFormMutable ?? teknetesForm} submissionAction={submissionAction} />
            </TabContentBody>
        </TabContent>
    );
};