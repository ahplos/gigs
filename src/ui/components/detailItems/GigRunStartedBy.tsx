import * as React from 'react';

import { IconStatus, Status } from '@patternfly/react-component-groups/dist/dynamic/Status';

import{
    ResourceIcon,
} from '@openshift-console/dynamic-plugin-sdk';

const USER_GVK = { group: 'rbac.authorization.k8s.io', version: 'v1', kind: 'User' }
const SA_GVK = { version: 'v1', kind: 'ServiceAccount' }

const GigRunStartedBy = (model) => {
    let startedBy = model.obj.status?.startedBy ?? model.obj.status?.latestGigRun?.startedBy;

    const gvk = (startedBy && (startedBy.indexOf(':') > 0)) ? SA_GVK : USER_GVK;

    return <Status label={startedBy} status={IconStatus.custom} icon={<ResourceIcon groupVersionKind={gvk}/>}/>;
}

export default GigRunStartedBy;