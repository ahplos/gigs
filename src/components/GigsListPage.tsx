import * as React from 'react';
import {
  List,
  ListItem,
} from '@patternfly/react-core';

import {
  ListPageHeader,
  ListPageBody,
  ListPageCreate,
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
  Gig.
  GigDefinition,
  GigRun
} from '../utilities/objectDefs';

type GigTableProps = {
  data: K8sResourceCommon[];
  unfilteredData: K8sResourceCommon[];
  loaded: boolean;
  loadError: any;
};

let gdGroupVersionKind = { group: 'batch.teknetes.org', version: 'v1beta1', kind: 'GigDefinition' }
let gigGroupVersionKind = { group: 'batch.teknetes.org', version: 'v1beta1', kind: 'Gig' }
let cjGroupVersionKind = { group: 'batch', version: 'vi', kind: 'CronJob' }

const GigDefinitionsTable: React.FC<GigTableProps> = ({ data, unfilteredData, loaded, loadError }) => {

  const columns: TableColumn<K8sResourceCommon>[] = [
    {
      title: 'Name',
      id: 'name',
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
      title: 'Params',
      id: 'params',
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

  type Gig = K8sResourceCommon & {
    spec: {
      cronJobRef: {
        name: string
      }
      gigDefinitionRef: {
        name: string
      }
    }
  }

  let listItems = (gigDef: Gig) => {
    return gigDef.spec.formSpec?.map((widget) => <ListItem><b>{widget.var}</b> [{widget.components[0].inputType}]</ListItem>)
  };

  const PodRow: React.FC<RowProps<GigDefinition>> = ({ obj, activeColumnIDs }) => {


    return (
      <>
        <TableData id={columns[0].id} activeColumnIDs={activeColumnIDs}>
          <ResourceLink groupVersionKind={gdGroupVersionKind} name={obj.metadata.name} namespace={obj.metadata.namespace} />
        </TableData>
        <TableData id={columns[1].id} activeColumnIDs={activeColumnIDs}>
          <ResourceLink groupVersionKind={gdGroupVersionKind} name={obj.metadata.name} />
        </TableData>
        <TableData id={columns[2].id} activeColumnIDs={activeColumnIDs}>
          <ResourceLink groupVersionKind={cjGroupVersionKind} name={obj.metadata.name} namespace={obj.metadata.namespace} />
        </TableData>
        <TableData id={columns[1].id} activeColumnIDs={activeColumnIDs}>
          <List isPlain>
            {listItems(obj)}
          </List>
        </TableData>
        <TableData id={columns[2].id} activeColumnIDs={activeColumnIDs}>
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
      Row={PodRow}
    />
  );
}

const GigsListPage = () => {

  const [gds, gdLoaded, gdLoadError] = useK8sWatchResource<K8sResourceCommon[]>({
    groupVersionKind: gdGroupVersionKind,
    isList: true,
    namespaced: false,
  });

  return (
    <>
      <ListPageHeader title={'Teknetes GigDefinitions'}>
        <ListPageCreate groupVersionKind={gdGroupVersionKind}>{'Create GigDefinition'}</ListPageCreate>
      </ListPageHeader>
      <ListPageBody>
        <GigDefinitionsTable
          data={gds}
          unfilteredData={gds}
          loaded={gdLoaded}
          loadError={gdLoadError}
        />
      </ListPageBody>
    </>
  );
};

export default GigsListPage;