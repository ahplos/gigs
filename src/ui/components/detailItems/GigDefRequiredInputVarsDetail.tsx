import * as React from 'react';

import {
    List,
    ListItem,
} from '@patternfly/react-core';

import {
    GigDefinition,
} from '../../utilities/objectDefs';


export const GigDefRequiredInputVarsDetail = (model) => {
    const gigDef: GigDefinition = model.obj;

    return (
        <List isPlain>
            {gigDef.spec.requiredInputParams?.map((param) => <ListItem><b>{param}</b></ListItem>)}
        </List>
    );
}

export default GigDefRequiredInputVarsDetail;