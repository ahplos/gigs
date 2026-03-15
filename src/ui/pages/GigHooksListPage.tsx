import * as React from 'react';
import {
    List,
    ListItem,
    Switch,
} from '@patternfly/react-core';

import {
    ListPageHeader,
    ListPageBody,
    ListPageCreate,
    VirtualizedTable,
    K8sResourceCommon,
    TableData,
    RowProps,
    ResourceLink,
    TableColumn,
} from '@openshift-console/dynamic-plugin-sdk';


import {
    GIG_GVK,
    GigHook,
    GIG_HOOK_GVK,
    NS_GVK,
} from '../utilities/objectDefs';

import GigK8sUtils from '../utilities/gigK8sUtils';

type GigHookTableProps = {
    data: K8sResourceCommon[];
    unfilteredData: K8sResourceCommon[];
    loaded: boolean;
    loadError: any;
};

const GigHooksTable: React.FC<GigHookTableProps> = ({ data, unfilteredData, loaded, loadError }) => {

    const columns: TableColumn<K8sResourceCommon>[] = [
        {
            title: 'Name',
            id: 'name',
        },
        {
            title: 'Namespace',
            id: 'namespace',
        },
        {
            title: 'Gig',
            id: 'gig',
        },
        {
            title: 'Header Fields',
            id: 'validated',
        },
        {
            title: 'QueryString Fields',
            id: 'validated',
        },
        {
            title: 'Payload Fields',
            id: 'mapped',
        },
        {
            title: 'Enabled',
            id: 'enabled',
        },
    ];

    let listItems = (gigHook: GigHook, source: string) => {
        return gigHook.spec.eventData?.filter(data => data.source == source)?.map((data) =>
            <ListItem>{data.key}<sup>{data.validation ? '*': ''}</sup>{data.inputVar ? '[' + data.inputVar + ']' : ''}</ListItem>
        ) ?? []
    };

    const GigModulesRow: React.FC<RowProps<GigHook>> = ({ obj, activeColumnIDs }) => {
        const gigHook: GigHook = obj;
        const [gigHookEnabled, setGigHookEnabled] = React.useState(gigHook.spec.isEnabled);

        const headerFields = listItems(gigHook, 'Header');
        const queryStringFields = listItems(gigHook, 'QueryString');
        const payloadFields = listItems(gigHook, 'Payload');

        return (
            <>
                <TableData id={columns[0].id} activeColumnIDs={activeColumnIDs}>
                    <ResourceLink groupVersionKind={GIG_HOOK_GVK} name={gigHook.metadata.name} namespace={gigHook.metadata.namespace} />
                </TableData>
                <TableData id={columns[1].id} activeColumnIDs={activeColumnIDs}>
                    <ResourceLink groupVersionKind={NS_GVK} name={gigHook.metadata.namespace} />
                </TableData>
                <TableData id={columns[2].id} activeColumnIDs={activeColumnIDs}>
                    <ResourceLink groupVersionKind={GIG_GVK} name={gigHook.metadata.name} namespace={gigHook.metadata.namespace} />
                </TableData>
                <TableData id={columns[3].id} activeColumnIDs={activeColumnIDs}>
                    {headerFields.length ? <List isPlain>{headerFields}</List> : '-'}
                </TableData>
                <TableData id={columns[4].id} activeColumnIDs={activeColumnIDs}>
                    {queryStringFields.length ? <List isPlain>{queryStringFields}</List> : '-'}
                </TableData>
                <TableData id={columns[5].id} activeColumnIDs={activeColumnIDs}>
                    {payloadFields.length ? <List isPlain>{payloadFields}</List> : '-'}
                </TableData>
                <TableData id={columns[6].id} activeColumnIDs={activeColumnIDs}>
                    <Switch id="{gigHook.name}"
                            isChecked={gigHookEnabled}
                            onChange={() => { GigK8sUtils.toggleGigHookEnabled(gigHook, !gigHookEnabled); setGigHookEnabled(!gigHookEnabled)} } />
                </TableData>
            </>
        );
    };

    return (
        <VirtualizedTable<K8sResourceCommon>
            data={data}
            unfilteredData={unfilteredData}
            loaded={loaded}
            loadError={loadError}
            columns={columns}
            Row={GigModulesRow}
        />
    );
}

export const GigHooksListPage = (model) => {

    const [gds, loaded, loadError] = GigK8sUtils.getGigHooks({namespace: model.namespace});

    return (
        <>
            <ListPageHeader title={'Ahplos GigHooks'}>
                <ListPageCreate groupVersionKind={GIG_HOOK_GVK}>{'Create GigHook'}</ListPageCreate>
            </ListPageHeader>
            <ListPageBody>
                <GigHooksTable
                    data={gds}
                    unfilteredData={gds}
                    loaded={loaded}
                    loadError={loadError}
                />
            </ListPageBody>
        </>
    );
};

export default GigHooksListPage;