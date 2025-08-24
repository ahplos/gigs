import * as React from 'react';

import { IconStatus } from '@patternfly/react-component-groups/dist/esm/Status';

import {
    GigDetailIcon,
    IconType,
} from './GigDetailIcon';

export const GigRunResultDetail = (model) => {
    let result = model.obj.status?.result ?? model.obj.status?.latestGigRun?.result;

    let icon = <GigDetailIcon type={IconType.PENDING} label={result} status={IconStatus.custom} />;
    switch (result) {
        case 'Aborted':
            icon = <GigDetailIcon type={IconType.ABORTED} label={result} status={IconStatus.danger} />
            break;
        case 'Success':
            icon = <GigDetailIcon type={IconType.CHECK_CIRCLE} label={result} status={IconStatus.success} />
            break;
        case 'Failure':
            icon = <GigDetailIcon type={IconType.ERROR_CIRCLE} label={result} status={IconStatus.danger} />
            break;
    };

    return icon;
}

export default GigRunResultDetail;