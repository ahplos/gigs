import * as React from 'react';

import {
    List,
    ListComponent,
    ListItem,
    OrderType,
} from '@patternfly/react-core';

import {
    ResourceLink,
} from '@openshift-console/dynamic-plugin-sdk';

import {
    GigModule,
    GIG_GVK,
    GIG_MODULE_GVK,
} from '../../utilities/objectDefs';

function getStageListItem(stage, gigMod) {
    if (stage.steps) {
        return <ListItem><b>{stage.name}</b><br/>STEPS: {stage.steps.length}</ListItem>
    }
    else if (stage.stageRef) {
        let namespace = stage.stageRef.gigModuleRef.namespace ?? gigMod.metadata.namespace;
        return <ListItem><b>{stage.name}</b><br/>
                   IMPORT FROM: <ResourceLink groupVersionKind={GIG_MODULE_GVK}
                                              name={stage.stageRef.gigModuleRef.name}
                                              namespace={namespace}/>
               </ListItem>
    }
    else {
        let namespace = stage.gigRef.namespace ?? gigMod.metadata.namespace;
        return <ListItem><b>{stage.name}</b><br/>
                   LAUNCH GIG: <ResourceLink groupVersionKind={GIG_GVK}
                                             name={stage.gigRef.name}
                                             namespace={namespace}/>
               </ListItem>
    }
}

const orderedProps = {
    component: ListComponent.ol,
    type: OrderType.number
}

const plainProps = {
    isPlain: true
}

export const GigModStagesDetail = (model) => {
    if (model) {
        const gigMod: GigModule = model.obj;

        const stageListItems = gigMod.spec.stages ?
            gigMod.spec.stages.map((stage) => getStageListItem(stage, gigMod)) : <ListItem>None</ListItem>;


        return (
            <List {...(gigMod.spec.stages ? orderedProps : plainProps )} >
                { stageListItems }
            </List>
        );
    }
}

export default GigModStagesDetail;