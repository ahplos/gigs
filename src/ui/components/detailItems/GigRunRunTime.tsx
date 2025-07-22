import * as React from 'react';

import { IconStatus, Status } from '@patternfly/react-component-groups/dist/dynamic/Status';

import StopwatchIcon from '@patternfly/react-icons/dist/esm/icons/stopwatch-icon';

const GigRunRunTime = (model) => {
    let runTime = model.obj.status?.runTime ?? model.obj.status?.latestGigRun?.runTime;
    let gigRunRunTime = runTime ? new Date(runTime * 1000).toISOString().slice(11, 19) : null;

    return (
        <Status label={gigRunRunTime} status={IconStatus.custom} icon={<StopwatchIcon/>}/>
    );
}

export default GigRunRunTime;