import * as React from 'react';

import {
    TabContent,
    TabContentBody
} from '@patternfly/react-core';

import {
    Gig,
    GIGRUN_GVK,
} from '../utilities/objectDefs';

import GigK8sUtils from '../utilities/gigK8sUtils';

import {
    GigRunsList,
} from '../gigUiComponents';

export const GigRunsListTab = (model, page, component) => {
    let gig: Gig = model.obj;

    let gigRunsGetOption = {
        namespace: gig.metadata.namespace,
        selectors: {
            [`${GIGRUN_GVK.group.toLowerCase()}/${GIGRUN_GVK.kind.toLowerCase()}`]: gig.metadata.name
        }
    };
    const [gigRuns, loaded, loadError] = GigK8sUtils.getGigRuns(gigRunsGetOption);

    return (
        <TabContent id="run-job-tab">
            <TabContentBody hasPadding>
                <GigRunsList
                    gigRuns={gigRuns}
                    loaded={loaded}
                    loadError={loadError}
                />
            </TabContentBody>
        </TabContent>
    );
};

export default GigRunsListTab;