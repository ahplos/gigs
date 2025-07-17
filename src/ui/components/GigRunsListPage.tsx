import * as React from 'react';

import {
  VirtualizedTable,
  useK8sWatchResource,
  K8sResourceCommon,
  TableData,
  RowProps,
  ResourceLink,
  TableColumn,
  Timestamp
} from '@openshift-console/dynamic-plugin-sdk';

import {
    TabContent,
    TabContentBody
}  from '@patternfly/react-core';

import {
  Gig,
  GigRun,
  GIG_GVK,
  GIG_RUN_GVK,
} from '../utilities/objectDefs';

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
      title: 'Gig',
      id: 'Gig',
    },
    {
      title: 'Started By',
      id: 'startedby',
    },
    {
      title: 'State',
      id: 'state',
    },
    {
      title: 'Result',
      id: 'result',
    },
    {
      title: 'Created',
      id: 'created',
    },
    {
      title: 'Run Time',
      id: 'runtime',
    }
  ];


  const GigRunsRow: React.FC<RowProps<GigRun>> = ({ obj, activeColumnIDs }) => {
    return (
      <>
        <TableData id={columns[0].id} activeColumnIDs={activeColumnIDs}>
          <ResourceLink groupVersionKind={GIG_RUN_GVK} name={obj.metadata.name} namespace={obj.metadata.namespace} />
        </TableData>
        <TableData id={columns[1].id} activeColumnIDs={activeColumnIDs}>
          <ResourceLink groupVersionKind={GIG_GVK} name={obj.spec.gigRef.name} namespace={obj.metadata.namespace} />
        </TableData>
        <TableData id={columns[2].id} activeColumnIDs={activeColumnIDs}>
          {obj.status?.startedBy}
        </TableData>
        <TableData id={columns[3].id} activeColumnIDs={activeColumnIDs}>
          {obj.status?.state}
        </TableData>
        <TableData id={columns[4].id} activeColumnIDs={activeColumnIDs}>
          {obj.status?.result}
        </TableData>
        <TableData id={columns[5].id} activeColumnIDs={activeColumnIDs}>
          <Timestamp timestamp={obj.metadata.creationTimestamp} />
        </TableData>
        <TableData id={columns[6].id} activeColumnIDs={activeColumnIDs}>
          {obj.status?.runTime ? new Date(obj.status?.runTime * 1000).toISOString().slice(11, 19) : null}
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
    />
  );
}

const GigRunsListPage = (model, page, component) => {

  let gig: Gig = model.obj

  const [gigRuns, gdLoaded, gdLoadError] = useK8sWatchResource<GigRun[]>({
    groupVersionKind: GIG_RUN_GVK,
    selector: {
      matchLabels: {
        [`${GIG_RUN_GVK.group.toLowerCase()}/${gig.kind.toLowerCase()}`]: gig.metadata.name
      },
    },
    isList: true,
    namespaced: true,
  });

  return (
    <>
      <TabContent id="run-job-tab">
          <TabContentBody hasPadding>
        <GigRunsTable
          data={gigRuns}
          unfilteredData={gigRuns}
          loaded={gdLoaded}
          loadError={gdLoadError}
        />
          </TabContentBody>
      </TabContent>
    </>
  );
};

export default GigRunsListPage;