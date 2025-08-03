import * as React from 'react';
import { Base64 } from 'js-base64';

import {
    Bullseye,
    Banner,
    Button,
    Divider,
    Flex,
    FlexItem,
    Spinner,
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
    getPod,
    GigRun,
} from '../utilities/objectDefs';

import {
    GigRunResult,
    GigRunStartedBy,
    GigRunState,
    GigRunRunTime,
} from './gigUiComponents';

interface GigRunLogViewerprops {
    gigRun: GigRun,
    pod?: K8sResourceKind
}

const PERCENT_HEIGHT_100 = '100%'

function GigRunLogViewerContent({ gigRun, pod }: GigRunLogViewerprops) {
    const podPhase = pod.status['phase'];
    const POD_COMPLETED =  podPhase === 'Succeeded' || podPhase === 'Failed';

    const logViewerRef = React.useRef(null);

    const [podLogs, setPodLogs] = React.useState<string>('');
    const [initialized, setInitialized] = React.useState<boolean>(false);

    const [paused, setPaused] = React.useState<boolean>(false);
    const [pauseDisabled, setPauseDisabled] = React.useState<boolean>(POD_COMPLETED);

    const [isLinesWrppped, setLinesWrppped] = React.useState<boolean>(false);
    const [isShowLineNumbers, setShowLineNumbers] = React.useState<boolean>(true);
    const [isFullScreen, setFullScreen] = React.useState<boolean>(false);

    const [errData, setErrData] = React.useState<string>('');

    React.useEffect(() => {
        if (!paused && !pauseDisabled) {
            logViewerRef.current.scrollToBottom();
        }
    }, [paused, podLogs]);

    const showLineNumbers = (event: React.FormEvent<HTMLInputElement>, checked: boolean) => {
        setShowLineNumbers(checked);
    }

    const changeLinesWrapped = (event: React.FormEvent<HTMLInputElement>, checked: boolean) => {
        setLinesWrppped(checked);
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
                    <Tooltip content={paused ? 'Resume autoscrolling' : 'Pause autoscrolling'} entryDelay={1500} isVisible={!pauseDisabled}>
                        <Button variant='plain' onClick={() => setPaused(!paused)} isDisabled={pauseDisabled}>
                            {paused ? <PlayIcon/> : <PauseIcon/>}
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
                        isChecked={isLinesWrppped}
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
                            {totalLines} totalLines
                        </Text>
                    </FlexItem>
                </Flex>
                <Flex align={{ default: 'alignRight' }} spacer={{ default: 'spacerXs' }}>
                    <FlexItem >
                        <GigRunStartedBy obj={gigRun} />
                    </FlexItem>
                    <FlexItem >
                        <GigRunState obj={gigRun} />
                    </FlexItem>
                    <FlexItem >
                        <GigRunResult obj={gigRun} />
                    </FlexItem>
                    <FlexItem >
                        <GigRunRunTime obj={gigRun} />
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

        webSocket.onmessage((msg) => {
            const message = Base64.decode(msg);
            setPodLogs((prevState) => {
                return prevState += message;;
            });
        }).onerror(() => {
            handleError();
        });

        webSocket.onclose((event) => {
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
            isTextWrapped={isLinesWrppped}
            data={errData ? errData : podLogs}
            initialIndexWidth={3}
            height={PERCENT_HEIGHT_100}
        />
    );
};

export default function GigRunLogViewer({ gigRun }: GigRunLogViewerprops) {

    const [pod, _, errorMessage] = getPod({
        namespace: gigRun.metadata.namespace,
        selector: {
            matchLabels: {
                'batch.kubernetes.io/job-name': gigRun.metadata.name,
            },
        },
    });

    if (pod) {
        return <GigRunLogViewerContent pod={pod} gigRun={gigRun}/>;
    }
    else if (errorMessage?.length > 0) {
        return <Banner variant='red'>ERROR: {errorMessage}</Banner>;
    }
    else {
        return <Bullseye><Spinner size="lg" aria-label="Fetching logs..." /></Bullseye>;
    }
}