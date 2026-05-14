import * as React from 'react';

import {
    List,
    ListItem,
} from '@patternfly/react-core';

import {
    sortable,
    SortByDirection,
} from '@patternfly/react-table';

import {
    K8sResourceCommon,
    ListPageBody,
    ListPageHeader,
    RowProps,
    ResourceLink,
    TableColumn,
    TableData,
    Timestamp,
    VirtualizedTable,
} from '@openshift-console/dynamic-plugin-sdk';

import {
    CRONJOB_GVK,
    Gig,
    GIG_GVK,
    GIG_MODULE_GVK,
    GIG_FORM_GVK,
    NS_GVK
} from '../utilities/objectDefs';

import GigK8sUtils from '../utilities/gigK8sUtils';

import {
    GigRunRunStateDetail,
    GigRunRunTimeDetail,
    GigRunStartedByDetail,
} from '../gigUiComponents';

type GigTableProps = {
    data: K8sResourceCommon[];
    unfilteredData: K8sResourceCommon[];
    loaded: boolean;
    loadError: any;
};

const GigsTable: React.FC<GigTableProps> = ({ data, unfilteredData, loaded, loadError }) => {

    const columns: TableColumn<K8sResourceCommon>[] = [
        {
            title: 'Name',
            id: 'name',
            sort: 'metadata.name',
            transforms: [sortable],
        },
        {
            title: 'Namespace',
            id: 'namespace',
            sort: 'metadata.namespace',
            transforms: [sortable],
        },
        {
            title: 'GigModule',
            id: 'gig-module',
            sort: 'spec.gigModuleRef',
            transforms: [sortable],
        },
        {
            title: 'GigForm',
            id: 'gig-launchform',
            sort: 'spec.gigFormRef',
            transforms: [sortable],
        },
        {
            title: 'CronJob',
            id: 'cronjob',
        },
        {
            title: 'Latest GigRun Summary',
            id: 'gigrun-last-summary',
        },
        {
            title: 'Created',
            id: 'created',
            sort: 'metadata.creationTimestamp',
            transforms: [sortable],
        },
    ];

    const GigRow: React.FC<RowProps<Gig>> = ({ obj, activeColumnIDs }) => {
        return (
            <>
                <TableData id={columns[0].id} activeColumnIDs={activeColumnIDs}>
                    <ResourceLink groupVersionKind={GIG_GVK} name={obj.metadata.name} namespace={obj.metadata.namespace} />
                </TableData>
                <TableData id={columns[1].id} activeColumnIDs={activeColumnIDs}>
                    <ResourceLink groupVersionKind={NS_GVK} name={obj.metadata.namespace} />
                </TableData>
                <TableData id={columns[2].id} activeColumnIDs={activeColumnIDs}>
                    <ResourceLink groupVersionKind={GIG_MODULE_GVK}
                                  name={obj.spec.gigModuleRef.name}
                                  namespace={obj.spec.gigModuleRef.namespace ?? obj.metadata.namespace} />
                </TableData>
                <TableData id={columns[3].id} activeColumnIDs={activeColumnIDs}>
                    {obj.spec.gigFormRef &&
                        <ResourceLink groupVersionKind={GIG_FORM_GVK}
                                      name={obj.spec.gigFormRef.name}
                                      namespace={obj.spec.gigFormRef?.namespace ?? obj.metadata.namespace} />}
                </TableData>
                <TableData id={columns[4].id} activeColumnIDs={activeColumnIDs}>
                    <ResourceLink groupVersionKind={CRONJOB_GVK} name={obj.spec.cronJobRef.name} namespace={obj.metadata.namespace} />
                </TableData>
                <TableData id={columns[5].id} activeColumnIDs={activeColumnIDs}>
                    {obj?.status?.latestGigRun &&
                        <List isPlain>
                            <ListItem><GigRunStartedByDetail obj={obj}/></ListItem>
                            <ListItem><GigRunRunStateDetail obj={obj}/></ListItem>
                            <ListItem><Timestamp timestamp={obj.status.latestGigRun.creationTimestamp}/></ListItem>
                            <ListItem><GigRunRunTimeDetail obj={obj}/></ListItem>
                        </List>
                    }
                </TableData>
                <TableData id={columns[6].id} activeColumnIDs={activeColumnIDs}>
                    <Timestamp timestamp={obj.metadata.creationTimestamp} />
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
            Row={GigRow}
            sortColumnIndex={5}
            sortDirection={SortByDirection.desc}
        />
    );
}

export const GigsListPage = (model) => {
    const [gigs, loaded, loadError] = GigK8sUtils.getGigs({namespace: model.namespace});

    return (
        <>
            <ListPageHeader title={'Ahplos Gigs'} />
            <ListPageBody>
                <GigsTable
                    data={gigs}
                    unfilteredData={gigs}
                    loaded={loaded}
                    loadError={loadError}
                />
            </ListPageBody>
        </>
    );
};

export default GigsListPage;