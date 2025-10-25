import * as React from 'react';

import {
    List,
    ListComponent,
    ListItem,
    OrderType,
} from '@patternfly/react-core';

import {
    GigModule,
} from '../../utilities/objectDefs';


export const GigDefStagesDetail = (model) => {
    const gigDef: GigModule = model.obj;

    return (
        <List component={ListComponent.ol} type={OrderType.number}>
            {gigDef.spec.stages?.map((stage) => <ListItem><b>{stage.displayName ?? stage.name}</b> [{stage.interpreter}]</ListItem>)}
        </List>
    );
}

export default GigDefStagesDetail;