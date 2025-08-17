import * as React from 'react';

import { IconStatus } from '@patternfly/react-component-groups/dist/dynamic/Status';

import {
    GigDetailIcon,
    IconType,
} from './GigDetailIcon';

const USER_GVK = { group: 'rbac.authorization.k8s.io', version: 'v1', kind: 'User' }
const SA_GVK = { version: 'v1', kind: 'ServiceAccount' }

const GigRunStartedBy = (model) => {
    let startedBy = model.obj.spec?.startedBy ?? model.obj.status?.latestGigRun?.startedBy;

    const gvk = (startedBy && (startedBy.indexOf(':') > 0)) ? SA_GVK : USER_GVK;

    return <GigDetailIcon type={IconType.RESOURCE} label={startedBy} status={IconStatus.custom} gvk={gvk}/>;
}

export default GigRunStartedBy;