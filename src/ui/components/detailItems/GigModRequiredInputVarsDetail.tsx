import * as React from 'react';

import {
    List,
    ListItem,
} from '@patternfly/react-core';

import {
    GigModule,
} from '../../utilities/objectDefs';


export const GigModRequiredInputVarsDetail = (model) => {
    const gigDef: GigModule = model.obj;

    return (
        <List isPlain>
            {gigDef.spec.requiredInputParams?.map((param) => <ListItem><b>{param}</b></ListItem>)}
        </List>
    );
}

export default GigModRequiredInputVarsDetail;