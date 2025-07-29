import * as React from 'react';

import { Navigate } from 'react-router-dom-v5-compat';

import {
    TabContent,
    TabContentBody
} from '@patternfly/react-core';

import {
    sortable,
    SortByDirection,
} from '@patternfly/react-table';

import {
    useK8sWatchResource,
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
    GIG_RUN_GVK,
    GIG_MAP,
    CURRENT_GIG
} from '../utilities/objectDefs';

import {
    GigRunResult,
    GigRunStartedBy,
    GigRunState,
    GigRunRunTime,
} from './gigUiComponents';

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
            id: 'startedby',
            sort: 'status.startedby',
            transforms: [sortable],
        },
        {
            title: 'State',
            id: 'state',
            sort: 'status.state',
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
        }
    ];


    const GigRunsRow: React.FC<RowProps<GigRun>> = ({ obj, activeColumnIDs }) => {
        return (
            <>
                <TableData id={columns[0].id} activeColumnIDs={activeColumnIDs}>
                    <ResourceLink groupVersionKind={GIG_RUN_GVK} name={obj.metadata.name} namespace={obj.metadata.namespace}/>
                </TableData>
                <TableData id={columns[1].id} activeColumnIDs={activeColumnIDs}>
                    <GigRunStartedBy obj={obj}/>
                </TableData>
                <TableData id={columns[2].id} activeColumnIDs={activeColumnIDs}>
                    <GigRunState obj={obj}/>
                </TableData>
                <TableData id={columns[3].id} activeColumnIDs={activeColumnIDs}>
                    <GigRunResult obj={obj}/>
                </TableData>
                <TableData id={columns[4].id} activeColumnIDs={activeColumnIDs}>
                    <GigRunRunTime obj={obj}/>
                </TableData>
                <TableData id={columns[5].id} activeColumnIDs={activeColumnIDs}>
                    <Timestamp timestamp={obj.metadata.creationTimestamp}/>
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

const GigRunsListPage = (model, page, component) => {
    if (model.obj) {
        let gig: Gig = model.obj;
        GIG_MAP.set(CURRENT_GIG, gig);

        let selector = {
            matchLabels: {
                [`${GIG_RUN_GVK.group.toLowerCase()}/${gig.kind.toLowerCase()}`]: gig.metadata.name
            }
        }

        const [gigRuns, gdLoaded, gdLoadError] = useK8sWatchResource<GigRun[]>({
            groupVersionKind: GIG_RUN_GVK,
            selector: selector,
            isList: true,
            namespaced: true,
        });

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
        let gig = GIG_MAP.get(CURRENT_GIG);
        if (gig) {
            let path = '/k8s/ns/' + gig.metadata.namespace + '/batch.teknetes.org~v1beta1~Gig/' + gig.metadata.name + '/gigruns';
            return <Navigate to={path}/>;
        }
    }
};

export default GigRunsListPage;