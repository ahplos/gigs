import * as React from 'react';

import { IconStatus, Status } from '@patternfly/react-component-groups/dist/dynamic/Status';

import CheckCircleIcon from '@patternfly/react-icons/dist/esm/icons/check-circle-icon';
import ErrorCircleIcon from '@patternfly/react-icons/dist/esm/icons/error-circle-o-icon';
import PendingIcon from '@patternfly/react-icons/dist/esm/icons/pending-icon';

const GigRunResult = (model) => {
    let result = model.obj.status?.result ?? model.obj.status?.latestGigRun?.result;

    let icon = null;
    switch (result) {
        case 'Success':
            icon = <Status label={result} status={IconStatus.success} icon={<CheckCircleIcon/>}/>
            break;
        case 'Failure':
            icon = <Status label={result} status={IconStatus.custom} icon={<ErrorCircleIcon/>}/>
            break;
        case 'Pending':
            icon = <Status label={result} status={IconStatus.custom} icon={<PendingIcon/>}/>
            break;

    };

    return icon;
}


export default GigRunResult;