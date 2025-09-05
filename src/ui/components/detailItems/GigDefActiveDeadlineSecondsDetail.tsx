import * as React from 'react';

import {
    Text,
} from '@patternfly/react-core';

import {
    GigDefinition,
} from '../../utilities/objectDefs';


export const GigDefActiveDeadlineSecondsDetail = (model) => {
    const gigDef: GigDefinition = model.obj;

    return (
        <Text>{gigDef.spec.activeDeadlineSeconds}s</Text>
    );
}

export default GigDefActiveDeadlineSecondsDetail;