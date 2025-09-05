import * as React from 'react';

import {
    List,
    ListComponent,
    ListItem,
    OrderType,
} from '@patternfly/react-core';

import {
    GigLaunchForm,
} from '../../utilities/objectDefs';


export const GigFormSummaryDetail = (model) => {
    const gigForm: GigLaunchForm = model.obj;

    return (
        <List component={ListComponent.ol} type={OrderType.number}>
            {gigForm.spec.inputForm?.map((comp) => <ListItem><b>{comp.var}</b> [{comp.components[0].inputType}]</ListItem>)}
        </List>
    );
}

export default GigFormSummaryDetail;