#!/usr/bin/bash
STAGE_NAME=${1}
STAGE_PROCESSOR=${2}
STAGE_DESC="${3}"
STAGE_SECRETS="${4}"

echo '******************************************************************'
echo '**'
echo "**  STAGE: ${STAGE_NAME}"
echo "**  Processor: ${STAGE_PROCESSOR}"
if [[ ${STAGE_DESC} ]]
then
    echo '**'
    echo "** ${STAGE_DESC}"
fi
if [[ ${STAGE_SECRETS} ]]
then
    echo '**'
    echo "** WARNING: SHELL LOGGING OUTPUT REDACTED FOR THIS STAGE"
fi
echo '**'
echo "******************************************************************"
echo