import * as React from 'react';

import {
    IconStatus
} from '@patternfly/react-component-groups/dist/dynamic/Status';

import {
    GigDetailIcon,
    IconType,
} from './GigDetailIcon';

import {
    GigRunState
} from '../../utilities/objectDefs'

export const GigRunRunStateDetail = (model) => {
    let state = model.obj.spec?.runState ?? model.obj.status?.latestGigRun?.runState;

    let status: IconStatus = IconStatus.info;
    let iconType: IconType = IconType.QUESTION_CIRCLE;
    switch (state) {
        case GigRunState.Aborting:
            iconType = IconType.ERROR_CIRCLE;
            status = IconStatus.warning;
            break;
        case GigRunState.Aborted:
        case GigRunState.Failed:
            iconType = IconType.ERROR_CIRCLE;
            status = IconStatus.danger;
            break;
        case GigRunState.Running:
            iconType = IconType.RUNNING;
            status = IconStatus.success;
            break;
        case GigRunState.Succeeded:
            iconType = IconType.CHECK_CIRCLE;
            status = IconStatus.success;
            break;
        case GigRunState.WaitingForInput:
            iconType = IconType.QUESTION_CIRCLE;
            status = IconStatus.info;
            break;
    };

    return <GigDetailIcon type={iconType} label={state} status={status} />
}

export default GigRunRunStateDetail;