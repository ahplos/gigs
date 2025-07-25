#!/usr/bin/bash
__STAGE_NAME=${1}
__STAGE_PROCESSOR=${2}
__STAGE_DESC="${3}"

echo
echo "******************************************************************"
echo "**"
echo "**  STAGE: ${__STAGE_NAME}"
echo "**  Processor: ${__STAGE_PROCESSOR}"
if [[ ${__STAGE_DESC} ]]
then
    echo "**"
    echo "** ${__STAGE_DESC}"
fi
echo "**"
echo "******************************************************************"
echo