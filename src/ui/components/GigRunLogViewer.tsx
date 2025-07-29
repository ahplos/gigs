import * as React from 'react';

import {
    Flex,
    FlexItem,
    Switch,
    Text,
} from '@patternfly/react-core';

import {
    LogViewer,
    LogViewerSearch,
} from '@patternfly/react-log-viewer';

import { GigRun } from '../utilities/objectDefs';

import {
    GigRunResult,
    GigRunStartedBy,
    GigRunState,
    GigRunRunTime,
} from './gigUiComponents';

interface GigRunLogViewerprops {
    gigRun: GigRun
}

const PERCENT_HEIGHT_100 = '100%'

export default function GigRunLogViewer({gigRun}: GigRunLogViewerprops) {
    const logViewerRef = React.useRef(null);

    const [isShowLineNumbers, setShowLineNumbers] = React.useState<boolean>(true);
    const [showAllLines, setShowAllLines] = React.useState<boolean>(false);

    let lines = (data.data.match(/\n/g) || '').length + 1;

    const showLineNumbers = (event: React.FormEvent<HTMLInputElement>, checked: boolean) => {
        setShowLineNumbers(checked);
    }

    const changeShowAllLines = (event: React.FormEvent<HTMLInputElement>, checked: boolean) => {
        setShowAllLines(checked);

        const element = document.querySelector('#' + gigRun.metadata.name);
        if (checked) {
            if (element.requestFullscreen) {
                element.requestFullscreen();
            }
        } else {
            document.exitFullscreen();
        }
    }

    const LogToolbar = () => {
        return (
            <Flex>
                <Flex>
                    <FlexItem>
                        <LogViewerSearch/>
                    </FlexItem>
                    <FlexItem>
                        <Switch
                            id='gigrun-log-viewer-show-line-numbers'
                            label="Hide Line Numbers"
                            labelOff="Show Line Numbers"
                            isChecked={isShowLineNumbers}
                            onChange={showLineNumbers}
                            ouiaId="BasicSwitch"
                        />
                    </FlexItem>
                </Flex>
                <Flex align={{ default: 'alignRight' }} spacer={{ default: 'spacerXs' }}>
                    <FlexItem>
                        <Switch
                            id='gigrun-log-viewer-show-all-lines'
                            label="Collapse Log Viewer"
                            labelOff="Expand Log Viewer"
                            isChecked={showAllLines}
                            onChange={changeShowAllLines}
                            ouiaId="BasicSwitch"
                        />
                    </FlexItem>
                </Flex>
            </Flex>
        );
    };

    const LogHeader = () => {
        return (
            <Flex>
                <Flex>
                    <FlexItem>
                        <Text>
                            {lines} lines
                        </Text>
                    </FlexItem>
                </Flex>
                <Flex align={{ default: 'alignRight' }} spacer={{ default: 'spacerXs' }}>
                    <FlexItem >
                        <GigRunStartedBy obj={gigRun}/>
                    </FlexItem>
                    <FlexItem >
                        <GigRunState obj={gigRun}/>
                    </FlexItem>
                    <FlexItem >
                        <GigRunResult obj={gigRun}/>
                    </FlexItem>
                    <FlexItem >
                        <GigRunRunTime obj={gigRun}/>
                    </FlexItem>
                </Flex>
            </Flex>
        );
    }

    return (
        <LogViewer
            id={gigRun.metadata.name}
            ref={logViewerRef}
            header={<LogHeader/>}
            toolbar={<LogToolbar/>}
            hasLineNumbers={isShowLineNumbers}
            data={data.data}
            initialIndexWidth={3}
            height={PERCENT_HEIGHT_100}
        />
    );
};

const data = { data: `\
    Lorem ipsum dolor sit amet, consectetur adipiscing elit,
    sed do eiusmod tempor incididunt ut labore et dolore magna
    aliqua. Ut enim ad minim veniam, quis nostrud exercitation
    ullamco laboris nisi ut aliquip ex ea commodo consequat.
    Duis aute irure dolor in reprehenderit in voluptate velit
    esse cillum dolore eu fugiat nulla pariatur. Excepteur
    sint occaecat cupidatat non proident, sunt in culpa qui
    officia deserunt mollit anim id est laborum.

    <a href="https://github.com/teknetes/teknetes-gigs/blob/development/src/ui/utilities/createJob.ts/">Testing</a>

    https://github.com/teknetes/teknetes-gigs/blob/development/src/ui/utilities/createJob.ts

    Lorem ipsum dolor sit amet, consectetur adipiscing elit,
    sed do eiusmod tempor incididunt ut labore et dolore magna
    aliqua. Ut enim ad minim veniam, quis nostrud exercitation
    ullamco laboris nisi ut aliquip ex ea commodo consequat.
    Duis aute irure dolor in reprehenderit in voluptate velit
    esse cillum dolore eu fugiat nulla pariatur. Excepteur
    sint occaecat cupidatat non proident, sunt in culpa qui
    officia deserunt mollit anim id est laborum.

    Lorem ipsum dolor sit amet, consectetur adipiscing elit,
    sed do eiusmod tempor incididunt ut labore et dolore magna
    aliqua. Ut enim ad minim veniam, quis nostrud exercitation
    ullamco laboris nisi ut aliquip ex ea commodo consequat.
    Duis aute irure dolor in reprehenderit in voluptate velit
    esse cillum dolore eu fugiat nulla pariatur. Excepteur
    sint occaecat cupidatat non proident, sunt in culpa qui
    officia deserunt mollit anim id est laborum.

    Lorem ipsum dolor sit amet, consectetur adipiscing elit,
    sed do eiusmod tempor incididunt ut labore et dolore magna
    aliqua. Ut enim ad minim veniam, quis nostrud exercitation
    ullamco laboris nisi ut aliquip ex ea commodo consequat.
    Duis aute irure dolor in reprehenderit in voluptate velit
    esse cillum dolore eu fugiat nulla pariatur. Excepteur
    sint occaecat cupidatat non proident, sunt in culpa qui
    officia deserunt mollit anim id est laborum.

    Lorem ipsum dolor sit amet, consectetur adipiscing elit,
    sed do eiusmod tempor incididunt ut labore et dolore magna
    aliqua. Ut enim ad minim veniam, quis nostrud exercitation
    ullamco laboris nisi ut aliquip ex ea commodo consequat.
    Duis aute irure dolor in reprehenderit in voluptate velit
    esse cillum dolore eu fugiat nulla pariatur. Excepteur
    sint occaecat cupidatat non proident, sunt in culpa qui
    officia deserunt mollit anim id est laborum.

    Lorem ipsum dolor sit amet, consectetur adipiscing elit,
    sed do eiusmod tempor incididunt ut labore et dolore magna
    aliqua. Ut enim ad minim veniam, quis nostrud exercitation
    ullamco laboris nisi ut aliquip ex ea commodo consequat.
    Duis aute irure dolor in reprehenderit in voluptate velit
    esse cillum dolore eu fugiat nulla pariatur. Excepteur
    sint occaecat cupidatat non proident, sunt in culpa qui
    officia deserunt mollit anim id est laborum.

    Lorem ipsum dolor sit amet, consectetur adipiscing elit,
    sed do eiusmod tempor incididunt ut labore et dolore magna
    aliqua. Ut enim ad minim veniam, quis nostrud exercitation
    ullamco laboris nisi ut aliquip ex ea commodo consequat.
    Duis aute irure dolor in reprehenderit in voluptate velit
    esse cillum dolore eu fugiat nulla pariatur. Excepteur
    sint occaecat cupidatat non proident, sunt in culpa qui
    officia deserunt mollit anim id est laborum.

    Lorem ipsum dolor sit amet, consectetur adipiscing elit,
    sed do eiusmod tempor incididunt ut labore et dolore magna
    aliqua. Ut enim ad minim veniam, quis nostrud exercitation
    ullamco laboris nisi ut aliquip ex ea commodo consequat.
    Duis aute irure dolor in reprehenderit in voluptate velit
    esse cillum dolore eu fugiat nulla pariatur. Excepteur
    sint occaecat cupidatat non proident, sunt in culpa qui
    officia deserunt mollit anim id est laborum.

    Lorem ipsum dolor sit amet, consectetur adipiscing elit,
    sed do eiusmod tempor incididunt ut labore et dolore magna
    aliqua. Ut enim ad minim veniam, quis nostrud exercitation
    ullamco laboris nisi ut aliquip ex ea commodo consequat.
    Duis aute irure dolor in reprehenderit in voluptate velit
    esse cillum dolore eu fugiat nulla pariatur. Excepteur
    sint occaecat cupidatat non proident, sunt in culpa qui
    officia deserunt mollit anim id est laborum.\
    `
}
