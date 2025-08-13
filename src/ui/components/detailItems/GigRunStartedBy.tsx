import * as React from 'react';

import { IconStatus } from '@patternfly/react-component-groups/dist/dynamic/Status';

import {
    GigDetailIcon,
    IconType,
} from './GigDetailIcon';

const USER_GVK = { group: 'rbac.authorization.k8s.io', version: 'v1', kind: 'User' }
const SA_GVK = { version: 'v1', kind: 'ServiceAccount' }

const GigRunStartedBy = (model) => {
    let startedby = model.obj.status?.startedby ?? model.obj.status?.latestGigRun?.startedby;

    const gvk = (startedby && (startedby.indexOf(':') > 0)) ? SA_GVK : USER_GVK;

    return <GigDetailIcon type={IconType.RESOURCE} label={startedby} status={IconStatus.custom} gvk={gvk}/>;
}

export default GigRunStartedBy;