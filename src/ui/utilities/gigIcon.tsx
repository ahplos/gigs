import * as React from 'react';

import {
    Icon,
    Spinner,
    Text,
    TextContent
} from '@patternfly/react-core';

import { IconStatus } from '@patternfly/react-component-groups/dist/dynamic/Status';

import CheckCircleIcon from '@patternfly/react-icons/dist/dynamic/icons/check-circle-icon';
import ErrorCircleIcon from '@patternfly/react-icons/dist/dynamic/icons/error-circle-o-icon';
import PendingIcon from '@patternfly/react-icons/dist/dynamic/icons/pending-icon';
import QuestionCircleIcon from '@patternfly/react-icons/dist/dynamic/icons/question-circle-icon';
import RunningIcon from '@patternfly/react-icons/dist/dynamic/icons/running-icon';
import StopwatchIcon from '@patternfly/react-icons/dist/dynamic/icons/stopwatch-icon';

import{
    ResourceIcon,
    K8sGroupVersionKind
} from '@openshift-console/dynamic-plugin-sdk';

interface GigIconProps {
    type: string
    status: IconStatus
    label: string
    gvk?: K8sGroupVersionKind
}

export enum IconType {
    CHECK_CIRCLE = 'CheckCircle',
    ERROR_CIRCLE = 'ErrorCircle',
    PENDING = 'Pending',
    QUESTION_CIRCLE = 'QuestionCircle',
    RESOURCE = 'Resource',
    RUNNING = 'Running',
    STOP_WATCH = 'Stopwatch',
}

export const GigIcon: React.FC<GigIconProps> = ({type, status, label, gvk}) => {
    let PicIcon;
    let isInProgress = false;
    switch (type) {
        case IconType.CHECK_CIRCLE:
            PicIcon = CheckCircleIcon;
            break;
        case IconType.ERROR_CIRCLE:
            PicIcon = ErrorCircleIcon;
            break;
        case IconType.PENDING:
            PicIcon = PendingIcon;
            break;
        case IconType.RESOURCE:
            PicIcon = ResourceIcon
            break;
        case IconType.QUESTION_CIRCLE:
            PicIcon = QuestionCircleIcon
            break;
        case IconType.RUNNING:
            PicIcon = RunningIcon
            isInProgress = true;
            break;
        case IconType.STOP_WATCH:
            PicIcon = StopwatchIcon
            break;
    };

    return (
        <TextContent>
            <Text>
                <Icon status={status} isInline  isInProgress={isInProgress} progressIcon={<Spinner diameter="1em" aria-label="Running..." />}>
                    <PicIcon groupVersionKind={gvk}/>
                </Icon>
                &nbsp;{label}
            </Text>
        </TextContent>
    );
}

export default GigIcon;