import * as React from 'react';

import {
    List,
    ListComponent,
    ListItem,
    OrderType,
} from '@patternfly/react-core';

import {
    GigDefinition,
} from '../../utilities/objectDefs';


export const GigDefStagesDetail = (model) => {
    const gigDef: GigDefinition = model.obj;

    return (
        <List component={ListComponent.ol} type={OrderType.number}>
            {gigDef.spec.stages?.map((stage) => <ListItem><b>{stage.displayName ?? stage.name}</b> [{stage.processor}]</ListItem>)}
        </List>
    );
}

export default GigDefStagesDetail;