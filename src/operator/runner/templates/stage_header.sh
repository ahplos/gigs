#!/usr/bin/bash
STAGE_COUNTER=${1}
STAGE_NAME=${2}
STAGE_PROCESSOR=${3}
STAGE_DESC="${4}"
STAGE_SECRETS="${5}"

echo '******************************************************************'
echo '**'
echo "**  STAGE $(printf '%02d' ${STAGE_COUNTER}): ${STAGE_NAME}"
echo "**  Processor: ${STAGE_PROCESSOR}"
if [[ ${STAGE_DESC} ]]
then
    echo '**'
    echo "** ${STAGE_DESC}"
fi
if [[ ${STAGE_SECRETS} ]]
then
    echo '**'
    echo "** WARNING: DEBUG LOGGING OUTPUT SUPPRESSED FOR THIS STAGE"
fi
echo '**'
echo "******************************************************************"
echo