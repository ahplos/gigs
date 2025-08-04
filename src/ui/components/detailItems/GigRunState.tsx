import * as React from 'react';

import { IconStatus } from '@patternfly/react-component-groups/dist/dynamic/Status';

import {
    GigDetailIcon,
    IconType,
} from './GigDetailIcon';

const GigRunState = (model) => {
    let state = model.obj.status?.state ?? model.obj.status?.latestGigRun?.state;

    let iconType = IconType.QUESTION_CIRCLE;
    switch (state) {
        case 'Completed':
            iconType = IconType.CHECK_CIRCLE;
            break;
        case 'Running':
            iconType = IconType.RUNNING;
            break;
    };

    return <GigDetailIcon type={iconType} label={state} status={IconStatus.success} />
}


export default GigRunState;