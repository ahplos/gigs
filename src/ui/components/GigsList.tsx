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
    ListPageCreate,
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
    getGigs,
    GIG_GVK,
    GIG_DEFINITION_GVK,
    NS_GVK
} from '../utilities/objectDefs';

import {
    GigRunResult,
    GigRunStartedBy,
    GigRunState,
    GigRunRunTime,
} from './gigUiComponents';

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
            title: 'GigDefinition',
            id: 'gig-definition',
            sort: 'metadata.name',
            transforms: [sortable],
        },
        {
            title: 'CronJob',
            id: 'cronjob',
        },
        {
            title: 'Latest Run Status',
            id: 'gigrun-last',
        },
        {
            title: 'Latest Run Time',
            id: 'gigrun-last',
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
                    <ResourceLink groupVersionKind={GIG_DEFINITION_GVK} name={obj.spec.gigDefinitionRef.name} />
                </TableData>
                <TableData id={columns[3].id} activeColumnIDs={activeColumnIDs}>
                    <ResourceLink groupVersionKind={CRONJOB_GVK} name={obj.spec.cronJobRef.name} namespace={obj.metadata.namespace} />
                </TableData>
                <TableData id={columns[4].id} activeColumnIDs={activeColumnIDs}>
                    {obj?.status?.latestGigRun &&
                        <List isPlain>
                            <ListItem><GigRunStartedBy obj={obj}/></ListItem>
                            <ListItem><GigRunState obj={obj}/></ListItem>
                            <ListItem><GigRunResult obj={obj}/></ListItem>
                        </List>
                    }
                </TableData>
                <TableData id={columns[5].id} activeColumnIDs={activeColumnIDs}>
                    {obj?.status?.latestGigRun &&
                        <List isPlain>
                            <ListItem><Timestamp timestamp={obj.status.latestGigRun.creationTimestamp}/></ListItem>
                            <ListItem><GigRunRunTime obj={obj}/></ListItem>
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

const GigsList = () => {
    const [gigs, gigLoaded, gigLoadError] = getGigs()

    return (
        <>
            <ListPageHeader title={'Teknetes Gigs'}>
                <ListPageCreate groupVersionKind={GIG_GVK}>{'Create Gig'}</ListPageCreate>
            </ListPageHeader>
            <ListPageBody>
                <GigsTable
                    data={gigs}
                    unfilteredData={gigs}
                    loaded={gigLoaded}
                    loadError={gigLoadError}
                />
            </ListPageBody>
        </>
    );
};

export default GigsList;