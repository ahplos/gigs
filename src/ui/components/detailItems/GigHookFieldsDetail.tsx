import * as React from 'react';

import {
    List,
    ListItem,
    Text,
} from '@patternfly/react-core';

import {
    GigHook,
} from '../../utilities/objectDefs';

let listItems = (gigHook: GigHook, source: string) => {
    return gigHook.spec.eventData?.filter(data => data.source == source)?.map((data) =>
        <ListItem>{data.key}<sup>{data.validation ? '*': ''}</sup>{data.inputVar ? '[' + data.inputVar + ']' : ''}</ListItem>
    ) ?? []
};

export const GigHookHeaderFieldsDetail = (model) => {
    const gigHook: GigHook = model.obj;

    const items = listItems(gigHook, 'Header')

    const fieldsList = items.length ? <List isPlain>{items}</List> : <Text>-</Text>

    return (
        <>
            {fieldsList}
        </>
    );
}

export const GigHookPayloadFieldsDetail = (model) => {
    const gigHook: GigHook = model.obj;

    const items = listItems(gigHook, 'Payload')

    const fieldsList = items.length ? <List isPlain>{items}</List> : <Text>-</Text>

    return (
        <>
            {fieldsList}
        </>
    );
}

export const GigHookQueryStringFieldsDetail = (model) => {
    const gigHook: GigHook = model.obj;

    const items = listItems(gigHook, 'QueryString')

    const fieldsList = items.length ? <List isPlain>{items}</List> : <Text>-</Text>

    return (
        <>
            {fieldsList}
        </>
    );
}