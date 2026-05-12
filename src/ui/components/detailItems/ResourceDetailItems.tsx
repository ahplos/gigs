import * as React from 'react';

import {
    List,
    ListItem,
    Text
} from '@patternfly/react-core';

import {
    ResourceLink,
    Timestamp,
} from '@openshift-console/dynamic-plugin-sdk';

import {
    CRONJOB_GVK,
    Gig,
    GigRun,
    GIG_GVK,
    GIG_MODULE_GVK,
    GIG_FORM_GVK,
    GIG_MAP,
    CURRENT_GIGRUN
} from '../../utilities/objectDefs';

import {
    GigRunRunStateDetail,
    GigRunRunTimeDetail,
    GigRunStartedByDetail,
} from '../../gigUiComponents'


export const LatestGigRunDetail = (model) => {
    if (model.obj?.status?.latestGigRun) {
        return (
            <List isPlain>
                <ListItem><GigRunStartedByDetail obj={model.obj}/></ListItem>
                <ListItem><GigRunRunStateDetail obj={model.obj}/></ListItem>
                <ListItem><Timestamp timestamp={model.obj.status?.latestGigRun?.creationTimestamp}/></ListItem>
                <ListItem><GigRunRunTimeDetail obj={model.obj}/></ListItem>
            </List>
        );
    }
    else {
        return (
            <Text>No GigRuns available</Text>
        );
    }
}

export const GigDetail = (model) => {
    let gigRun: GigRun = model.obj;
    GIG_MAP.set(CURRENT_GIGRUN, gigRun);

    return <ResourceLink groupVersionKind={GIG_GVK} name={gigRun.spec.gigRef.name} namespace={model.obj.metadata.namespace} />
}

export const GigModuleDetail = (model) => {
    let gig: Gig = model.obj;

    let namespace = gig.spec.gigModuleRef?.namespace ?? model.obj.metadata.namespace;

    return <ResourceLink groupVersionKind={GIG_MODULE_GVK} name={gig.spec.gigModuleRef.name} namespace={namespace} />
}

export const GigFormDetail = (model) => {
    if (model.obj.spec.gigFormRef?.name) {
        let namespace = model.obj.spec.gigFormRef.namespace ?? model.obj.metadata.namespace;
        return <ResourceLink groupVersionKind={GIG_FORM_GVK} name={model.obj.spec.gigFormRef.name} namespace={namespace} />;
    }
    else {
        return <Text>No GigFrame</Text>
    }
}

export const CronJobDetail = (model) => {
    let gig: Gig = model.obj;
    let namespace = gig.metadata.namespace;

    if (model.obj.spec.gigFormRef?.name) {
        return <ResourceLink groupVersionKind={CRONJOB_GVK} name={gig.spec.cronJobRef.name} namespace={namespace} />;
    }
    else {
        return <Text>No GigFrame</Text>
    }
}