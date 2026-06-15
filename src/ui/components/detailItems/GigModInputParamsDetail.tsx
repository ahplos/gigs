import * as React from 'react';

import {
    List,
    ListItem,
} from '@patternfly/react-core';

import {
    GigModule,
} from '../../utilities/objectDefs';


export const GigModInputParamsDetail = (model) => {
    const gigMod: GigModule = model.obj;

    return (
        <List isPlain>
            { gigMod.spec.inputParams ?
                 (gigMod.spec.inputParams.map((param) => param.required ?
                    <ListItem><b>{param.name}</b></ListItem> :
                    <ListItem>{param.name}</ListItem>))
                : <ListItem>None</ListItem>
            }
        </List>
    );
}

export default GigModInputParamsDetail;