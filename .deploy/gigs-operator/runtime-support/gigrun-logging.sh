#!/usr/bin/bash
ECHO_XTRACE_REGEX='^[+]+\s+echo(\s|$)'

__DELIM=$'\x1F'

function __filterLogs() {
    local LOG_HDR=$(printf "%s%18s" "$(__gigRunTime)" "[${STEP_COUNTER:-${STAGE_COUNTER:---}}] ")
    local SECRETS_REGEX=$(__generateSecretFilter)
    echo "${LOG_OUT}" |
        sed -Ee "s${__DELIM}${SECRETS_REGEX:-$'\u2063'}${__DELIM}*****${__DELIM}g" \
            -e "/${ECHO_XTRACE_REGEX}/d" \
            -e "s/^/${LOG_HDR}/g"
}

function __logOutput() {
        (
            { set +x; } 2>/dev/null
            local OUT=$(
                while IFS='' read -r LOG_OUT
                do
                    [[ -z "${1}" ]] && __filterLogs
                done
            )

            echo "${OUT}"
        )
}

function __generateSecretFilter() {
    local GIG_SECRET_VARS="$(gigSecrets | xargs)"
    local GIG_VALUES=${GIG_SECRET_VARS:+$(gigdb-cli --raw HMGET GIG_ENV ${GIG_SECRET_VARS} | xargs)}

    local STAGE_SECRET_VARS=${STAGE_ID:+"$(stageSecrets | xargs)"}
    local STAGE_VALUES=${STAGE_SECRET_VARS:+$(gigdb-cli --raw HMGET ${STAGE_ID} ${STAGE_SECRET_VARS} | xargs)}

    local STEP_SECRET_VARS=${STEP_ID:+"$(stepSecrets | xargs)"}
    local STEP_VALUES=${STEP_SECRET_VARS:+$(gigdb-cli --raw HMGET ${STEP_ID} ${STEP_SECRET_VARS} | xargs)}

    echo "${GIG_VALUES}${STAGE_VALUES:+ ${STAGE_VALUES}}${STEP_VALUES:+ ${STEP_VALUES}}" | xargs | sed -e 's/[[:space:]]/|/g'
}

function __gigRunTime() {
    (
        { set +x; } 2>/dev/null
        local GIGRUN_TIME=$(gigdb-cli INFO | grep uptime_in_seconds | sed 's/[^0-9]//g')
        local HOURS=$((GIGRUN_TIME/3600))
        local MINUTES=$((GIGRUN_TIME%3600/60))
        local SECONDS=$((GIGRUN_TIME%60))
        echo $(printf '%02d:%02d:%02d' ${HOURS} ${MINUTES} ${SECONDS})
    )
}