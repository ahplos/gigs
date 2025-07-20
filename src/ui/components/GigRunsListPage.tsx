import * as React from 'react';

import { Navigate } from 'react-router-dom-v5-compat';



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
    TabContent,
    TabContentBody
}  from '@patternfly/react-core';

import {
  Gig,
  GigRun,
  GIG_GVK,
  GIG_RUN_GVK,
} from '../utilities/objectDefs';

import { GIG_MAP } from '../utilities/GigContext';


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

const CURRENT_GIG = 'CURRNET_GIG';

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
      selector:selector,
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
    const gig: Gig = GIG_MAP.get(CURRENT_GIG);
    return (
      <>
        <Navigate to={'/k8s/ns/' + gig.metadata.namespace + '/batch.teknetes.org~v1beta1~Gig/' + gig.metadata.name + '/gigruns'} />;
      </>
    );
  }
};

export default GigRunsListPage;