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
    GIG_LAUNCHFORM_GVK,
    NS_GVK,
} from '../utilities/objectDefs';

import GigK8sUtils from '../utilities/gigK8sUtils';

type GigLaunchFormTableProps = {
    data: K8sResourceCommon[];
    unfilteredData: K8sResourceCommon[];
    loaded: boolean;
    loadError: any;
};

const GigDefinitionsTable: React.FC<GigLaunchFormTableProps> = ({ data, unfilteredData, loaded, loadError }) => {

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

    const GigDefinitionsRow: React.FC<RowProps<GigForm>> = ({ obj, activeColumnIDs }) => {
        const gigForm: GigForm = obj;
        return (
            <>
                <TableData id={columns[0].id} activeColumnIDs={activeColumnIDs}>
                    <ResourceLink groupVersionKind={GIG_LAUNCHFORM_GVK} name={gigForm.metadata.name} namespace={gigForm.metadata.namespace} />
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
            Row={GigDefinitionsRow}
        />
    );
}

export const GigLaunchFormsListPage = (model) => {

    const [gds, loaded, loadError] = GigK8sUtils.getGigLaunchForms({namespace: model.namespace});

    return (
        <>
            <ListPageHeader title={'ahplos GigLaunchForms'}>
                <ListPageCreate groupVersionKind={GIG_LAUNCHFORM_GVK}>{'Create GigForm'}</ListPageCreate>
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

export default GigLaunchFormsListPage;