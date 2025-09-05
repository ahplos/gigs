import * as React from 'react';

import {
    Text,
} from '@patternfly/react-core';

import {
    GigDefinition,
} from '../../utilities/objectDefs';


export const GigDefWorkDirectorySizeLimitDetail = (model) => {
    const gigDef: GigDefinition = model.obj;

    return (
        <Text>{gigDef.spec.workDirSizeLimit}</Text>
    );
}

export default GigDefWorkDirectorySizeLimitDetail;