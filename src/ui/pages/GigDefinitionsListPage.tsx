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
    K8sResourceCommon,
    TableData,
    RowProps,
    ResourceLink,
    TableColumn,
    Timestamp,
} from '@openshift-console/dynamic-plugin-sdk';


import {
    GigDefinition,
    GIG_DEFINITION_GVK,
} from '../utilities/objectDefs';

import GigK8sUtils from '../utilities/gigK8sUtils';

type GigDefinitionTableProps = {
    data: K8sResourceCommon[];
    unfilteredData: K8sResourceCommon[];
    loaded: boolean;
    loadError: any;
};

const GigDefinitionsTable: React.FC<GigDefinitionTableProps> = ({ data, unfilteredData, loaded, loadError }) => {

    const columns: TableColumn<K8sResourceCommon>[] = [
        {
            title: 'Name',
            id: 'name',
        },
        {
            title: 'Params',
            id: 'params',
        },
        {
            title: 'Created',
            id: 'created',
        },
    ];

    let listItems = (gigDef: GigDefinition) => {
        return gigDef.spec.form?.spec?.map((widget) => <ListItem><b>{widget.var}</b> [{widget.components[0].inputType}]</ListItem>)
    };

    const GigDefinitionsRow: React.FC<RowProps<GigDefinition>> = ({ obj, activeColumnIDs }) => {
        return (
            <>
                <TableData id={columns[0].id} activeColumnIDs={activeColumnIDs}>
                    <ResourceLink groupVersionKind={GIG_DEFINITION_GVK} name={obj.metadata.name} namespace={obj.metadata.namespace} />
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
            Row={GigDefinitionsRow}
        />
    );
}

export const GigDefinitionsListPage = () => {

    const [gds, loaded, loadError] = GigK8sUtils.getGigDefinitions();

    return (
        <>
            <ListPageHeader title={'Teknetes GigDefinitions'}>
                <ListPageCreate groupVersionKind={GIG_DEFINITION_GVK}>{'Create GigDefinition'}</ListPageCreate>
            </ListPageHeader>
            <ListPageBody>
                <GigDefinitionsTable
                    data={gds}
                    unfilteredData={gds}
                    loaded={loaded}
                    loadError={loadError}
                />
            </ListPageBody>
        </>
    );
};

export default GigDefinitionsListPage;