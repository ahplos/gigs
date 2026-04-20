import * as React from 'react';
import { Base64 } from 'js-base64';

import {
    Button,
    Divider,
    Flex,
    FlexItem,
    Switch,
    Text,
    Tooltip,
} from '@patternfly/react-core';

import CompressIcon from '@patternfly/react-icons/dist/dynamic/icons/compress-icon';
import CopyIcon from '@patternfly/react-icons/dist/dynamic/icons/copy-icon';
import ExpandIcon from '@patternfly/react-icons/dist/dynamic/icons/expand-icon';
import PauseIcon from '@patternfly/react-icons/dist/dynamic/icons/pause-icon';
import PlayIcon from '@patternfly/react-icons/dist/dynamic/icons/play-icon';

import {
    LogViewer,
    LogViewerSearch,
} from '@patternfly/react-log-viewer';

import {
    K8sResourceKind,
    consoleFetchText,
} from '@openshift-console/dynamic-plugin-sdk';

import {
    WSFactory
} from '@openshift-console/dynamic-plugin-sdk/lib/utils/k8s/ws-factory';

import {
    GigRun,
    GIG_MAP,
    CURRENT_GIG_RUN
} from '../utilities/objectDefs';

import {
    GigDetail,
    GigRunRunStateDetail,
    GigRunStartedByDetail,
    GigRunRunTimeDetail,
} from '../gigUiComponents';

interface GigRunLogViewerProps {
    gigRun: GigRun,
    pod?: K8sResourceKind
}

const PERCENT_HEIGHT_100 = '100%'

export function GigRunLogViewer({ gigRun, pod }: GigRunLogViewerProps) {
    const podPhase = pod.status['phase'];
    const POD_COMPLETED = podPhase === 'Succeeded' || podPhase === 'Failed';

    const logViewerRef = React.useRef(null);

    const [podLogs, setPodLogs] = React.useState<string>('');
    const [initialized, setInitialized] = React.useState<boolean>(false);

    const [paused, setPaused] = React.useState<boolean>(false);
    const [pauseDisabled, setPauseDisabled] = React.useState<boolean>();

    const [isLinesWrapped, setLinesWrapped] = React.useState<boolean>(true);
    const [isShowLineNumbers, setShowLineNumbers] = React.useState<boolean>(true);
    const [isFullScreen, setFullScreen] = React.useState<boolean>(false);

    const [errData, setErrData] = React.useState<string>('');

    const showLineNumbers = (event: React.FormEvent<HTMLInputElement>, checked: boolean) => {
        setShowLineNumbers(checked);
    }

    const changeLinesWrapped = (event: React.FormEvent<HTMLInputElement>, checked: boolean) => {
        setLinesWrapped(checked);
    }

    const clickExpandCollapse = (event: React.MouseEvent<HTMLButtonElement>) => {
        setFullScreen(!isFullScreen);

        const element = document.querySelector('#' + gigRun.metadata.name);
        isFullScreen ? document.exitFullscreen() : element.requestFullscreen();
    }

    const LogToolbar = () => {
        return (
            <Flex columnGap={{ default: 'columnGapMd' }}>
                <FlexItem>
                    <Tooltip content={paused ? 'Resume autoscrolling' : 'Pause autoscrolling'} entryDelay={1500}>
                        <Button variant='plain' onClick={() => setPaused(!paused)} isDisabled={pauseDisabled}>
                            {paused ? <PlayIcon /> : <PauseIcon />}
                        </Button>
                    </Tooltip>
                </FlexItem>
                <FlexItem>
                    <LogViewerSearch />
                </FlexItem>
                <FlexItem>
                    <Switch
                        id='gigrun-log-viewer-show-line-numbers'
                        label='Line Numbers'
                        isChecked={isShowLineNumbers}
                        onChange={showLineNumbers}
                        ouiaId='BasicSwitch'
                    />
                </FlexItem>
                <FlexItem >
                    <Switch
                        id='gigrun-log-viewer-totalLines-wrapped'
                        label='Wrap Lines'
                        isChecked={isLinesWrapped}
                        onChange={changeLinesWrapped}
                        ouiaId='BasicSwitch'
                    />
                </FlexItem>
                <FlexItem align={{ default: 'alignRight' }}>
                    <Button onClick={() => navigator.clipboard.writeText(podLogs)} variant='link' icon={<CopyIcon />}>
                        Copy to Clipboard
                    </Button>
                </FlexItem>
                <Divider orientation={{ default: 'vertical' }} />
                <FlexItem>
                    <Button onClick={clickExpandCollapse} variant='link' icon={isFullScreen ? <CompressIcon /> : <ExpandIcon />}>
                        {isFullScreen ? 'Collapse' : 'Expand'}
                    </Button>
                </FlexItem>
            </Flex>
        );
    };

    const LogHeader = () => {
        let totalLines = (podLogs?.match(/\n/g) || '')?.length + 1;
        return (
            <Flex>
                <Flex>
                    <FlexItem>
                        <Text>
                            {totalLines} Total Lines
                        </Text>
                    </FlexItem>
                </Flex>
                <Flex align={{ default: 'alignRight' }} spacer={{ default: 'spacerXs' }}>
                    <FlexItem>
                        <GigDetail obj={gigRun} />
                    </FlexItem>
                    <FlexItem >
                        <GigRunStartedByDetail obj={gigRun} />
                    </FlexItem>
                    <FlexItem >
                        <GigRunRunStateDetail obj={gigRun} />
                    </FlexItem>
                    <FlexItem >
                        <GigRunRunTimeDetail obj={gigRun} />
                    </FlexItem>
                </Flex>
            </Flex>
        );
    }

    const retryWebSocket = (
        watchURL: string,
        wsOpts: any,
        retryCount = 0
    ) => {
        const webSocket = new WSFactory(watchURL, wsOpts);

        const handleError = () => {
            if (retryCount < 5) {
                setTimeout(() => {
                    retryWebSocket(
                        watchURL,
                        wsOpts,
                        retryCount + 1
                    );
                }, 3000);
            }
            else {
                setErrData('Unable to connect to pod logs');
            }
        };

        let newLogs: string[] = [];
        const updateLogViewer = () => {
            if (newLogs.length) {
                setPodLogs((prevState) => {
                    return prevState + newLogs.join('');
                });

                if (!paused) {
                    logViewerRef.current?.scrollToBottom();
                }
                newLogs.length = 0;
            }
        }

        webSocket.onmessage((msg) => {
            const message = Base64.decode(msg);
            newLogs.push(message);

            setPauseDisabled(false);
        }).onerror(() => {
            handleError();
        });

        const refreshInterval = setInterval(() => {
            updateLogViewer();
        }, 100);

        webSocket.onclose((event) => {
            clearInterval(refreshInterval);
            if (newLogs.length) {
                updateLogViewer()
            }

            webSocket.destroy();
            setPauseDisabled(true);
        });
    };


    const readLogs = (pod: K8sResourceKind) => {
        let podName = pod.metadata.name;
        let podNamespace = pod.metadata.namespace;

        const watchURL = '/api/kubernetes/api/v1/namespaces/' + podNamespace + '/pods/' + podName + '/log?follow';
        if (POD_COMPLETED) {
            consoleFetchText(watchURL)
                .then((response) => {
                    setPodLogs((prevState) => {
                        return prevState += response;
                    });
                })
                .catch((e) => {
                    setErrData(e.getMessage);
                });

        }
        else {
            const wsOpts = {
                host: 'auto',
                path: watchURL,
                subprotocols: ['base64.binary.k8s.io'],
            };

            retryWebSocket(watchURL, wsOpts);
        }
    };

    if (!initialized) {
        GIG_MAP.set(CURRENT_GIG_RUN, gigRun);

        readLogs(pod);
        setInitialized(true);

    }

    return (
        <LogViewer
            id={gigRun.metadata.name}
            ref={logViewerRef}
            header={<LogHeader />}
            toolbar={<LogToolbar />}
            hasLineNumbers={isShowLineNumbers}
            isTextWrapped={isLinesWrapped}
            data={errData ? errData : podLogs}
            initialIndexWidth={3}
            height={PERCENT_HEIGHT_100}
        />
    );
};

export default GigRunLogViewer;