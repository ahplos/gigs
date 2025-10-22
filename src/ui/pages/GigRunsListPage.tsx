import * as React from 'react';

import {
    ListPageHeader,
    ListPageBody,
} from '@openshift-console/dynamic-plugin-sdk';

import GigK8sUtils from '../utilities/gigK8sUtils';

import {
    GigRunsList,
} from '../gigUiComponents';

export const GigRunsListPage = (model) => {
    const [gigRuns, gdLoaded, gdLoadError] = GigK8sUtils.getGigRuns({namespace: model.namespace});

    return (
        <>
            <ListPageHeader title={'ahplos GigRuns'} />
            <ListPageBody>
                <GigRunsList
                    gigRuns={gigRuns}
                    loaded={gdLoaded}
                    loadError={gdLoadError}
                />
            </ListPageBody>
        </>
    );
};

export default GigRunsListPage;