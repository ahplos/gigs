import * as React from 'react';
import {
  List,
  ListItem,
} from '@patternfly/react-core';

import {
  K8sResourceCommon,
  ListPageBody,
  ListPageCreate,
  ListPageHeader,
  NamespaceBar,
  RowProps,
  ResourceLink,
  TableColumn,
  TableData,
  Timestamp,
  useK8sWatchResource,
  VirtualizedTable,
} from '@openshift-console/dynamic-plugin-sdk';

import {
  cronJobGroupVersionKind,
  Gig,
  gigGroupVersionKind,
  gigDefinitionGroupVersionKind,
  nsGroupVersionKind
} from '../utilities/objectDefs';

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
    },
    {
      title: 'Namespace',
      id: 'namespace',
    },
    {
      title: 'GigDefinition',
      id: 'gig-definition',
    },
    {
      title: 'CronJob',
      id: 'cronjob',
    },
    {
      title: 'Latest Run',
      id: 'lastest-run',
    },
    {
      title: 'Created',
      id: 'created',
    },
  ];

  const GigRow: React.FC<RowProps<Gig>> = ({ obj, activeColumnIDs }) => {
    return (
      <>
        <TableData id={columns[0].id} activeColumnIDs={activeColumnIDs}>
          <ResourceLink groupVersionKind={gigGroupVersionKind} name={obj.metadata.name} namespace={obj.metadata.namespace} />
        </TableData>
        <TableData id={columns[1].id} activeColumnIDs={activeColumnIDs}>
          <ResourceLink groupVersionKind={nsGroupVersionKind} name={obj.metadata.namespace} />
        </TableData>
        <TableData id={columns[2].id} activeColumnIDs={activeColumnIDs}>
          <ResourceLink groupVersionKind={gigDefinitionGroupVersionKind} name={obj.spec.gigDefinitionRef.name} />
        </TableData>
        <TableData id={columns[3].id} activeColumnIDs={activeColumnIDs}>
          <ResourceLink groupVersionKind={cronJobGroupVersionKind} name={obj.spec.cronJobRef.name} namespace={obj.metadata.namespace} />
        </TableData>
        <TableData id={columns[4].id} activeColumnIDs={activeColumnIDs}>
          { obj?.status?.lastRunBy &&
            <List isPlain>
                <ListItem>Account: {obj.status.lastRunBy.account}</ListItem>
                <ListItem>Start Time: {obj.status.lastRunBy.startTime}</ListItem>
                <ListItem>Result: {obj.status.lastRunBy.result}</ListItem>
            </List>
          }
        </TableData>
        <TableData id={columns[5].id} activeColumnIDs={activeColumnIDs}>
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
    />
  );
}

const GigsListPage = () => {
  const [gigs, gigLoaded, gigLoadError] = useK8sWatchResource<K8sResourceCommon[]>({
    groupVersionKind: gigGroupVersionKind,
    isList: true,
    namespaced: true,
  });

  return (
    <>
      <NamespaceBar />
      <ListPageHeader title={'Teknetes Gigs'}>
        <ListPageCreate groupVersionKind={gigGroupVersionKind}>{'Create Gig'}</ListPageCreate>
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

export default GigsListPage;