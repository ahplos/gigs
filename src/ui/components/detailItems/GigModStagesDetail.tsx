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


export const GigModStagesDetail = (model) => {
    const gigMod: GigModule = model?.obj;

    return (
        <List component={ListComponent.ol} type={OrderType.number}>
            {gigMod.spec.stages.map((stage) =>
                <ListItem><b>{stage.name}</b> ({stage.steps?.length ?? 'REFERENCE'})</ListItem>)}
        </List>
    );
}

export default GigModStagesDetail;