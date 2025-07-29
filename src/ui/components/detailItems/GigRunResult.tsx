import * as React from 'react';

import { IconStatus } from '@patternfly/react-component-groups/dist/esm/Status';

import {
    GigIcon,
    IconType,
} from '../../utilities/gigIcon';

const GigRunResult = (model) => {
    let result = model.obj.status?.result ?? model.obj.status?.latestGigRun?.result;

    let icon = <GigIcon type={IconType.PENDING} label={result} status={IconStatus.custom} />;
    switch (result) {
        case 'Success':
            icon = <GigIcon type={IconType.CHECK_CIRCLE} label={result} status={IconStatus.success} />
            break;
        case 'Failure':
            icon = <GigIcon type={IconType.ERROR_CIRCLE} label={result} status={IconStatus.danger} />
            break;
    };

    return icon;
}

export default GigRunResult;