import * as React from 'react';

import { IconStatus } from '@patternfly/react-component-groups/dist/dynamic/Status';

import {
    GigDetailIcon,
    IconType,
} from './GigDetailIcon';

export const GigRunRunTimeDetail = (model) => {
    let runTime = model.obj.status?.runTime ?? model.obj.status?.latestGigRun?.runTime;
    let gigRunRunTime;
    if (runTime) {
        gigRunRunTime = new Date(runTime * 1000).toISOString().slice(11, 19);
    }
    else {
        gigRunRunTime = new Date().getTime() - new Date(model.obj.metadata.creationTimestamp).getTime();
        gigRunRunTime = new Date(gigRunRunTime).toISOString().slice(11, 19);
    }


    return (
        <GigDetailIcon type={IconType.STOP_WATCH} label={gigRunRunTime} status={IconStatus.custom} />
    );
}

export default GigRunRunTimeDetail;