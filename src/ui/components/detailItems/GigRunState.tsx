import * as React from 'react';

import { IconStatus } from '@patternfly/react-component-groups/dist/dynamic/Status';

import {
    GigDetailIcon,
    IconType,
} from './GigDetailIcon';

const GigRunState = (model) => {
    let state = model.obj.spec?.runState;

    let iconType = IconType.QUESTION_CIRCLE;
    switch (state) {
        case 'Completed':
            iconType = IconType.CHECK_CIRCLE;
            break;
        case 'Running':
            iconType = IconType.RUNNING;
            break;
        case 'Aborting':
            iconType = IconType.ABORTING;
            break;
    };

    return <GigDetailIcon type={iconType} label={state} status={IconStatus.success} />
}


export default GigRunState;