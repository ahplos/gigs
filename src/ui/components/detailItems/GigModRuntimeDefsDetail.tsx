import * as React from 'react';

import {
    List,
    ListItem,
} from '@patternfly/react-core';

import {
    GigModule,
} from '../../utilities/objectDefs';

function getRuntimeListItem(runtime) {
    return (
        <ListItem>{runtime.name}</ListItem>
    )
}

function getRuntimeDefListItem(runtimeDef) {
    const runtimeListItems = runtimeDef.runtimes.map((runtime) => getRuntimeListItem(runtime));
    return (
        <ListItem>
            {runtimeDef.type}
            <List>
                { runtimeListItems }
            </List>
        </ListItem>
    )
}

const plainProps = {
    isPlain: true
}

export const GigModRuntimeDefsDetail = (model) => {
    if (model) {
        const gigMod: GigModule = model.obj;

        const runtimeDefListItems = gigMod.spec.runtimeDefs ?
            gigMod.spec.runtimeDefs.map((runtimeDef) => getRuntimeDefListItem(runtimeDef)) : <ListItem>None</ListItem>;


        return (
            <List {...(gigMod.spec.runtimeDefs ? {} : plainProps )} >
                { runtimeDefListItems }
            </List>
        );
    }
}

export default GigModRuntimeDefsDetail;