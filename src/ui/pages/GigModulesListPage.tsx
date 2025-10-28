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
    GigModule,
    GIG_MODULE_GVK,
    GIG_FORM_GVK,
    NS_GVK,
} from '../utilities/objectDefs';

import GigK8sUtils from '../utilities/gigK8sUtils';

type GigModuleTableProps = {
    data: K8sResourceCommon[];
    unfilteredData: K8sResourceCommon[];
    loaded: boolean;
    loadError: any;
};

const GigModulesTable: React.FC<GigModuleTableProps> = ({ data, unfilteredData, loaded, loadError }) => {

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
            title: 'Mode',
            id: 'mode',
        },
        {
            title: 'Default Launch Form',
            id: 'default-gig-form',
        },
        {
            title: 'Required Input Variables',
            id: 'required-input-vars',
        },
        {
            title: 'Stages',
            id: 'stages',
        },
        {
            title: 'Created',
            id: 'created',
        },
    ];

    const GigModulesRow: React.FC<RowProps<GigModule>> = ({ obj, activeColumnIDs }) => {
        const gigMod: GigModule = obj;

        const stageList = [];
        for (let stage of gigMod.spec.stages) {
            let stageName = stage.name;
            let stepCountOrRef = stage.steps ? stage.steps.length : 'REFERENCE';
            stageList.push(<ListItem><b>{stageName}</b> ({stepCountOrRef})</ListItem>);
        }

        return (
            <>
                <TableData id={columns[0].id} activeColumnIDs={activeColumnIDs}>
                    <ResourceLink groupVersionKind={GIG_MODULE_GVK}
                                  name={gigMod.metadata.name}
                                  namespace={gigMod.metadata.namespace}>
                    </ResourceLink>
                </TableData>
                <TableData id={columns[1].id} activeColumnIDs={activeColumnIDs}>
                    <ResourceLink groupVersionKind={NS_GVK} name={gigMod.metadata.namespace} />
                </TableData>
                <TableData id={columns[2].id} activeColumnIDs={activeColumnIDs}>
                    <span>&nbsp;{gigMod.spec.mode}</span>
                </TableData>
                <TableData id={columns[3].id} activeColumnIDs={activeColumnIDs}>
                    { gigMod.spec.gigFormRef &&
                        <ResourceLink groupVersionKind={GIG_FORM_GVK}
                                      name={gigMod.spec.gigFormRef.name}
                                      namespace={gigMod.spec.gigFormRef.namespace ?? gigMod.metadata.namespace}/>
                    }
                </TableData>
                <TableData id={columns[4].id} activeColumnIDs={activeColumnIDs}>
                    <List isPlain>
                        {gigMod.spec.requiredInputParams?.map((param) => <ListItem><b>{param}</b></ListItem>)}
                    </List>
                </TableData>
                <TableData id={columns[5].id} activeColumnIDs={activeColumnIDs}>
                    <List isPlain>
                        {...stageList}
                    </List>
                </TableData>
                <TableData id={columns[6].id} activeColumnIDs={activeColumnIDs}>
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
            Row={GigModulesRow}
        />
    );
}

export const GigModulesListPage = (model) => {

    const [gds, loaded, loadError] = GigK8sUtils.getGigModules({namespace: model.namespace});

    return (
        <>
            <ListPageHeader title={'Ahplos GigModules'}>
                <ListPageCreate groupVersionKind={GIG_MODULE_GVK}>{'Create GigModule'}</ListPageCreate>
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

export default GigModulesListPage;