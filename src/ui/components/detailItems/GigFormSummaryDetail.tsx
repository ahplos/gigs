import * as React from 'react';

import {
    List,
    ListComponent,
    ListItem,
    OrderType,
} from '@patternfly/react-core';

import {
    GigForm,
} from '../../utilities/objectDefs';


export const GigFormSummaryDetail = (model) => {
    const gigForm: GigForm = model.obj;

    return (
        <List component={ListComponent.ol} type={OrderType.number}>
            {gigForm.spec.inputForm?.map((comp) => <ListItem><b>{comp.var}</b> [{comp.inputType}]</ListItem>)}
        </List>
    );
}

export default GigFormSummaryDetail;