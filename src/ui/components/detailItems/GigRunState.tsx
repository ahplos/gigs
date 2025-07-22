import * as React from 'react';

import { IconStatus, Status } from '@patternfly/react-component-groups/dist/dynamic/Status';

import CheckCircleIcon from '@patternfly/react-icons/dist/esm/icons/check-circle-icon';
import QuestionCircleIcon from '@patternfly/react-icons/dist/esm/icons/question-circle-icon';
import RunningIcon from '@patternfly/react-icons/dist/esm/icons/running-icon';

const GigRunState = (model) => {
    let state = model.obj.status?.state ?? model.obj.status?.latestGigRun?.state;

    let icon = null;
    switch (state) {
        case 'Completed':
            icon = <Status label={state} status={IconStatus.success} icon={<CheckCircleIcon/>}/>
            break;
        case 'Running':
            icon = <Status label={state} status={IconStatus.custom} icon={<RunningIcon/>}/>
            break;
        case 'WaitingForUserInput':
            icon = <Status label={state} status={IconStatus.custom} icon={<QuestionCircleIcon/>}/>
            break;

    };

    return icon;
}


export default GigRunState;