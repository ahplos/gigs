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
    GIG_LAUNCHFORM_GVK,
    NS_GVK,
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
            title: 'Namespace',
            id: 'namespace',
        },
        {
            title: 'Default Launch Form',
            id: 'default-launch-form',
        },
        {
            title: 'Required Input Variables',
            id: 'required-input-vars',
        },
        {
            title: 'Processors',
            id: 'processors',
        },
        {
            title: 'Created',
            id: 'created',
        },
    ];

    const GigDefinitionsRow: React.FC<RowProps<GigDefinition>> = ({ obj, activeColumnIDs }) => {
        const gigDef: GigDefinition = obj;

        const stageProcCounts = {};
        for (let stage of gigDef.spec.stages) {
            stageProcCounts[stage.scriptType] = stageProcCounts[stage.scriptType] ?? 0;
            stageProcCounts[stage.scriptType]++;
        }

        let stageProcs = []
        Object.keys(stageProcCounts).forEach(proc => {
            stageProcs.push(<ListItem><b>{proc}</b> ({stageProcCounts[proc]})</ListItem>);
        });

        return (
            <>
                <TableData id={columns[0].id} activeColumnIDs={activeColumnIDs}>
                    <ResourceLink groupVersionKind={GIG_DEFINITION_GVK}
                                  name={gigDef.metadata.name}
                                  namespace={gigDef.metadata.namespace}>
                        <span>&nbsp;{gigDef.spec.isLibrary ? '[Library]' : ''}</span>
                    </ResourceLink>
                </TableData>
                <TableData id={columns[1].id} activeColumnIDs={activeColumnIDs}>
                    <ResourceLink groupVersionKind={NS_GVK} name={gigDef.metadata.namespace} />
                </TableData>
                <TableData id={columns[1].id} activeColumnIDs={activeColumnIDs}>
                    { gigDef.spec.gigLaunchFormRef &&
                        <ResourceLink groupVersionKind={GIG_LAUNCHFORM_GVK}
                                      name={gigDef.spec.gigLaunchFormRef.name}
                                      namespace={gigDef.spec.gigLaunchFormRef.namespace ?? gigDef.metadata.namespace}/>
                    }
                </TableData>
                <TableData id={columns[1].id} activeColumnIDs={activeColumnIDs}>
                    <List isPlain>
                        {gigDef.spec.requiredInputParams?.map((param) => <ListItem><b>{param}</b></ListItem>)}
                    </List>
                </TableData>
                <TableData id={columns[1].id} activeColumnIDs={activeColumnIDs}>
                    <List isPlain>
                        {...stageProcs}
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

export const GigDefinitionsListPage = (model) => {

    const [gds, loaded, loadError] = GigK8sUtils.getGigDefinitions({namespace: model.namespace});

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