import * as React from 'react';

import {
    Button,
} from '@patternfly/react-core';

import {
    sortable,
    SortByDirection,
} from '@patternfly/react-table';

import StopIcon from '@patternfly/react-icons/dist/dynamic/icons/stop-circle-icon';
import TrashIcon from '@patternfly/react-icons/dist/dynamic/icons/trash-icon';

import {
    K8sResourceCommon,
    RowProps,
    ResourceLink,
    TableColumn,
    TableData,
    Timestamp,
    VirtualizedTable,
} from '@openshift-console/dynamic-plugin-sdk';

import {
    GigRun,
    GigRunState,
    GIG_GVK,
    GIG_RUN_GVK,
    NS_GVK,
} from '../utilities/objectDefs';

import GigK8sUtils from '../utilities/gigK8sUtils';

import {
    GigRunStartedByDetail,
    GigRunRunStateDetail,
    GigRunRunTimeDetail,
} from '../gigUiComponents';

type GigRunTableProps = {
    data: K8sResourceCommon[];
    unfilteredData: K8sResourceCommon[];
    loaded: boolean;
    loadError: any;
};

const GigRunsTable: React.FC<GigRunTableProps> = ({ data, unfilteredData, loaded, loadError }) => {

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
            title: 'Started By',
            id: 'startedBy',
            sort: 'spec.startedBy',
            transforms: [sortable],
        },
        {
            title: 'Run State',
            id: 'state',
            sort: 'status.runState',
            transforms: [sortable],
        },
        {
            title: 'Run Time',
            id: 'runtime',
            sort: 'status.runTime',
            transforms: [sortable],
        },
        {
            title: 'Created',
            id: 'created',
            sort: 'metadata.creationTimestamp',
            transforms: [sortable],
        },
        {
            title: '',
            id: 'actions'
        }
    ];

    const gigRunActions = (obj) => {
        if ([GigRunState.Aborted, GigRunState.Failed, GigRunState.Succeeded].includes(obj.status.runState)) {
            GigK8sUtils.deleteGigRun(obj);
        }
        else {
            GigK8sUtils.patchGigRunRunState(obj, GigRunState.Aborting);
        }
    }

    const GigRunsRow: React.FC<RowProps<GigRun>> = ({ obj, activeColumnIDs }) => {
        const isRunning = ![GigRunState.Aborted, GigRunState.Failed, GigRunState.Succeeded].includes(obj.status.runState);
        return (
            <>
                <TableData id={columns[0].id} activeColumnIDs={activeColumnIDs}>
                    <ResourceLink groupVersionKind={GIG_RUN_GVK} name={obj.metadata.name} namespace={obj.metadata.namespace}/>
                </TableData>
                <TableData id={columns[1].id} activeColumnIDs={activeColumnIDs}>
                    <ResourceLink groupVersionKind={NS_GVK} name={obj.metadata.namespace} />
                </TableData>
                <TableData id={columns[2].id} activeColumnIDs={activeColumnIDs}>
                    <ResourceLink groupVersionKind={GIG_GVK} name={obj.spec.gigRef.name} />
                </TableData>
                <TableData id={columns[3].id} activeColumnIDs={activeColumnIDs}>
                    <GigRunStartedByDetail obj={obj}/>
                </TableData>
                <TableData id={columns[4].id} activeColumnIDs={activeColumnIDs}>
                    <GigRunRunStateDetail obj={obj}/>
                </TableData>
                <TableData id={columns[5].id} activeColumnIDs={activeColumnIDs}>
                    <GigRunRunTimeDetail obj={obj}/>
                </TableData>
                <TableData id={columns[6].id} activeColumnIDs={activeColumnIDs}>
                    <Timestamp timestamp={obj.metadata.creationTimestamp}/>
                </TableData>
                <TableData id={columns[7].id} activeColumnIDs={activeColumnIDs}>
                    <Button variant={isRunning ? 'link' : 'plain'}
                            onClick={() => gigRunActions(obj) }
                            isDanger={isRunning}
                            icon={isRunning ? <StopIcon/> : <TrashIcon/>}
                            isDisabled={obj.status.runState == GigRunState.Aborting} />
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
            Row={GigRunsRow}
            sortColumnIndex={7}
            sortDirection={SortByDirection.desc}
       />
    );
}

interface GigRunsListProps {
  gigRuns: GigRun[];
  loaded: boolean;
  loadError: any;
}

export const GigRunsList: React.FC<GigRunsListProps> = ({gigRuns, loaded, loadError}) => {
    return (
        <GigRunsTable
            data={gigRuns}
            unfilteredData={gigRuns}
            loaded={loaded}
            loadError={loadError}
        />
    );
};

export default GigRunsList;