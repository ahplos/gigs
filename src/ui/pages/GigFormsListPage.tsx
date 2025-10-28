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
    GigForm,
    GIG_FORM_GVK,
    NS_GVK,
} from '../utilities/objectDefs';

import GigK8sUtils from '../utilities/gigK8sUtils';

type GigFormTableProps = {
    data: K8sResourceCommon[];
    unfilteredData: K8sResourceCommon[];
    loaded: boolean;
    loadError: any;
};

const GigModulesTable: React.FC<GigFormTableProps> = ({ data, unfilteredData, loaded, loadError }) => {

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
            title: 'Params',
            id: 'params',
        },
        {
            title: 'Created',
            id: 'created',
        },
    ];

    let listItems = (gigForm: GigForm) => {
        return gigForm.spec.inputForm?.map((widget) => <ListItem><b>{widget.var}</b> [{widget.components[0].inputType}]</ListItem>)
    };

    const GigModulesRow: React.FC<RowProps<GigForm>> = ({ obj, activeColumnIDs }) => {
        const gigForm: GigForm = obj;
        return (
            <>
                <TableData id={columns[0].id} activeColumnIDs={activeColumnIDs}>
                    <ResourceLink groupVersionKind={GIG_FORM_GVK} name={gigForm.metadata.name} namespace={gigForm.metadata.namespace} />
                </TableData>
                <TableData id={columns[1].id} activeColumnIDs={activeColumnIDs}>
                    <ResourceLink groupVersionKind={NS_GVK} name={gigForm.metadata.namespace} />
                </TableData>
                <TableData id={columns[1].id} activeColumnIDs={activeColumnIDs}>
                    <List isPlain>
                        {listItems(gigForm)}
                    </List>
                </TableData>
                <TableData id={columns[2].id} activeColumnIDs={activeColumnIDs}>
                    <Timestamp timestamp={gigForm.metadata.creationTimestamp} />
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
            Row={GigModulesRow}
        />
    );
}

export const GigFormsListPage = (model) => {

    const [gds, loaded, loadError] = GigK8sUtils.getGigForms({namespace: model.namespace});

    return (
        <>
            <ListPageHeader title={'Ahplos GigForms'}>
                <ListPageCreate groupVersionKind={GIG_FORM_GVK}>{'Create GigForm'}</ListPageCreate>
            </ListPageHeader>
            <ListPageBody>
                <GigModulesTable
                    data={gds}
                    unfilteredData={gds}
                    loaded={loaded}
                    loadError={loadError}
                />
            </ListPageBody>
        </>
    );
};

export default GigFormsListPage;