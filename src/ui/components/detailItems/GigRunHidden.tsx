import * as React from 'react';

import { Text } from '@patternfly/react-core';

import {
    GigRun,
    GIG_MAP,
    CURRENT_GIG_RUN
} from '../../utilities/objectDefs';

const GigRunHidden = (model) => {
    let gigRun: GigRun = model.obj;
    GIG_MAP.set(CURRENT_GIG_RUN, gigRun);

    return (
        <Text></Text>
    );
}

export default GigRunHidden;