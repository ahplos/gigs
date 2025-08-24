import * as React from 'react';

import { Navigate } from 'react-router-dom-v5-compat';

import {
    Button,
    TabContent,
    TabContentBody
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
    Gig,
    GigRun,
    GigRunState,
    GIG_RUN_GVK,
    GIG_MAP,
    CURRENT_GIG_RUN
} from '../utilities/objectDefs';

import GigK8sUtils from '../utilities/gigK8sUtils';

import {
    GigRunResultDetail,
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
            title: 'Started By',
            id: 'startedBy',
            sort: 'spec.startedBy',
            transforms: [sortable],
        },
        {
            title: 'State',
            id: 'state',
            sort: 'spec.runState',
            transforms: [sortable],
        },
        {
            title: 'Result',
            id: 'result',
            sort: 'status.result',
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
        if (obj.spec.runState == GigRunState.Completed) {
            GigK8sUtils.deleteGigRun(obj)
        }
        else {
            GigK8sUtils.patchGigRunRunState(obj, true)
        }
    }

    const GigRunsRow: React.FC<RowProps<GigRun>> = ({ obj, activeColumnIDs }) => {
        const isRunning = obj.spec.runState != GigRunState.Completed;
        return (
            <>
                <TableData id={columns[0].id} activeColumnIDs={activeColumnIDs}>
                    <ResourceLink groupVersionKind={GIG_RUN_GVK} name={obj.metadata.name} namespace={obj.metadata.namespace}/>
                </TableData>
                <TableData id={columns[1].id} activeColumnIDs={activeColumnIDs}>
                    <GigRunStartedByDetail obj={obj}/>
                </TableData>
                <TableData id={columns[2].id} activeColumnIDs={activeColumnIDs}>
                    <GigRunRunStateDetail obj={obj}/>
                </TableData>
                <TableData id={columns[3].id} activeColumnIDs={activeColumnIDs}>
                    <GigRunResultDetail obj={obj}/>
                </TableData>
                <TableData id={columns[4].id} activeColumnIDs={activeColumnIDs}>
                    <GigRunRunTimeDetail obj={obj}/>
                </TableData>
                <TableData id={columns[5].id} activeColumnIDs={activeColumnIDs}>
                    <Timestamp timestamp={obj.metadata.creationTimestamp}/>
                </TableData>
                <TableData id={columns[6].id} activeColumnIDs={activeColumnIDs}>
                    <Button variant={isRunning ? 'link' : 'plain'}
                            onClick={() => gigRunActions(obj) }
                            isDanger={isRunning}
                            icon={isRunning ? <StopIcon/> : <TrashIcon/>} />
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
            sortColumnIndex={5}
            sortDirection={SortByDirection.desc}
       />
    );
}

export const GigRunsListPage = (model, page, component) => {
    if (model.obj) {
        let gig: Gig = model.obj;

        let gigRunsGetOption = {
            namespace: gig.metadata.namespace,
            selectors: {
                [`${GIG_RUN_GVK.group.toLowerCase()}/${GIG_RUN_GVK.kind.toLowerCase()}`]: gig.metadata.name
            }
        };
        const [gigRuns, gdLoaded, gdLoadError] = GigK8sUtils.getGigRuns(gigRunsGetOption);

        let gigRunsTable =
            <>
                <GigRunsTable
                    data={gigRuns}
                    unfilteredData={gigRuns}
                    loaded={gdLoaded}
                    loadError={gdLoadError}
               />
            </>;

        return (
            <TabContent id="run-job-tab">
                <TabContentBody hasPadding>
                    {gigRunsTable}
                </TabContentBody>
            </TabContent>
        );
    }
    else {
        let path='/gigs/all-namespaces';

        let gigRun = GIG_MAP.get(CURRENT_GIG_RUN);
        if (gigRun) {
            path = '/k8s/ns/' + gigRun.metadata.namespace + '/batch.teknetes.org~v1beta1~Gig/' + gigRun.spec.gigRef.name + '/gigruns';
        }

        return <Navigate to={path}/>;
    }
};

export default GigRunsListPage;