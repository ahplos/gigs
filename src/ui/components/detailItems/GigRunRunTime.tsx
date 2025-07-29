import * as React from 'react';

import { IconStatus } from '@patternfly/react-component-groups/dist/dynamic/Status';

import {
    GigIcon,
    IconType,
} from '../../utilities/gigIcon';

const GigRunRunTime = (model) => {
    let runTime = model.obj.status?.runTime ?? model.obj.status?.latestGigRun?.runTime;
    let gigRunRunTime = runTime ? new Date(runTime * 1000).toISOString().slice(11, 19) : null;

    return (
        <GigIcon type={IconType.STOP_WATCH} label={gigRunRunTime} status={IconStatus.custom} />
    );
}

export default GigRunRunTime;