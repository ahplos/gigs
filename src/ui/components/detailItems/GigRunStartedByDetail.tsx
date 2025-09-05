import * as React from 'react';

import { IconStatus } from '@patternfly/react-component-groups/dist/dynamic/Status';

import {
    SA_GVK,
    USER_GVK,
} from '../../utilities/objectDefs';

import {
    GigDetailIcon,
    IconType,
} from './GigDetailIcon';

export const GigRunStartedByDetail = (model) => {
    let startedBy = model.obj.spec?.startedBy ?? model.obj.status?.latestGigRun?.startedBy;

    const gvk = (startedBy && (startedBy.indexOf(':') > 0)) ? SA_GVK : USER_GVK;

    return <GigDetailIcon type={IconType.RESOURCE} label={startedBy} status={IconStatus.custom} gvk={gvk}/>;
}

export default GigRunStartedByDetail;