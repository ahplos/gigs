#!/usr/bin/bash
STAGE_COUNTER=${1}
STAGE_NAME=${2}
STAGE_PROCESSOR=${3}
STAGE_DESC="${4}"
STAGE_TYPE="${5}"


STAGE_HEADER=$(cat <<- EOF
    ******************************************************************
    **
    **  STAGE $(printf '%02d' ${STAGE_COUNTER}): ${STAGE_NAME}
    **  Processor: ${STAGE_PROCESSOR}
    **
EOF
)

if [[ ${STAGE_DESC} ]]
then
    STAGE_HEADER+=$(cat <<- EOF

        ** ${STAGE_DESC}
        **
EOF
)
fi

if [[ ${STAGE_TYPE} == 'HAS_SECRETS' ]]
then
    STAGE_HEADER+=$(cat <<- EOF

        ** WARNING: SECRETS REALIZED [Debug logging output suppressed]
        **
EOF
)
elif [[ ${STAGE_TYPE} == 'SKIPPED' ]]
then
    STAGE_HEADER+=$(cat <<- EOF

        ** WARNING: STAGE SKIPPED [Precondition(s) for execution failed]
        **
EOF
)
fi

STAGE_HEADER+=$(cat <<- EOF

    ******************************************************************
EOF
)

echo "${STAGE_HEADER}"