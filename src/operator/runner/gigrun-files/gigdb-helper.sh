#!/usr/bin/bash

function gigEnvExists() {
    ( { set +x; } 2>/dev/null; gigdb-cli --raw HISMEMBER 'GIG_ENV' "${1}" )
}

function gigEnvGet() {
    ( { set +x; } 2>/dev/null; gigdb-cli --raw HGET 'GIG_ENV' "${1}" )
}

function gigEnvGetCsv() {
    ( { set +x; } 2>/dev/null; gigdb-cli --raw --csv HGETALL 'GIG_ENV' )
}

function gigEnvGetJson() {
    ( { set +x; } 2>/dev/null; gigdb-cli --raw HGETALL 'GIG_ENV' | paste -d "=" - - | jo )
}

function gigEnvKeys() {
    ( { set +x; } 2>/dev/null; gigdb-cli --raw HKEYS 'GIG_ENV' )
}

function gigEnvSet() {
    ( { set +x; } 2>/dev/null; gigdb-cli --raw HSET 'GIG_ENV' "${1}" "${2}" > /dev/null )
}

function gigEnvValues() {
    ( { set +x; } 2>/dev/null; gigdb-cli --raw HVALS 'GIG_ENV' )
}

function stageEnvExists() {
    ( { set +x; } 2>/dev/null; gigdb-cli --raw HISMEMBER ${STAGE_ID} "${1}" )
}

function stageEnvGet() {
    ( { set +x; } 2>/dev/null; gigdb-cli --raw HGET ${STAGE_ID} "${1}" )
}

function stageEnvGetCsv() {
    ( { set +x; } 2>/dev/null; gigdb-cli --raw --csv HGETALL ${STAGE_ID} )
}

function stageEnvGetJson() {
    ( { set +x; } 2>/dev/null; gigdb-cli --raw HGETALL ${STAGE_ID} | paste -d "=" - - | jo )
}

function stageEnvKeys() {
    ( { set +x; } 2>/dev/null; gigdb-cli --raw HKEYS ${STAGE_ID} )
}

function stageEnvSet() {
    ( { set +x; } 2>/dev/null; gigdb-cli --raw HSET ${STAGE_ID} "${1}" "${2}" > /dev/null )
}

function stageEnvValues() {
    ( { set +x; } 2>/dev/null; gigdb-cli --raw HVALS ${STAGE_ID} )
}

function stepEnvExists() {
    ( { set +x; } 2>/dev/null; gigdb-cli --raw HISMEMBER ${STEP_ID} "${1}" )
}

function stepEnvGet() {
    ( { set +x; } 2>/dev/null; gigdb-cli --raw HGET ${STEP_ID} "${1}" )
}

function stepEnvGetCsv() {
    ( { set +x; } 2>/dev/null; gigdb-cli --raw --csv HGETALL ${STEP_ID} )
}

function stepEnvGetJson() {
    ( { set +x; } 2>/dev/null; gigdb-cli --raw HGETALL ${STEP_ID} | paste -d "=" - - | jo )
}

function stepEnvKeys() {
    ( { set +x; } 2>/dev/null; gigdb-cli --raw HKEYS ${STEP_ID} )
}

function stepEnvSet() {
    ( { set +x; } 2>/dev/null; gigdb-cli --raw HSET ${STEP_ID} "${1}" "${2}" > /dev/null )
}

function stepEnvValues() {
    ( { set +x; } 2>/dev/null; gigdb-cli --raw HVALS ${STEP_ID} )
}

function gigSecretsAdd() {
    ( { set +x; } 2>/dev/null; gigdb-cli --raw SADD GIG_SECRETS $* > /dev/null )
}

function gigSecretExists() {
    ( { set +x; } 2>/dev/null; gigdb-cli --raw SISMEMBER GIG_SECRETS "${1}" )
}

function gigSecrets() {
    ( { set +x; } 2>/dev/null; gigdb-cli --raw SMEMBERS GIG_SECRETS )
}

function gigSecretsRemove() {
    ( { set +x; } 2>/dev/null; gigdb-cli --raw SREM GIG_SECRETS $* > /dev/null )
}

function stageSecretsAdd() {
    ( { set +x; } 2>/dev/null; gigdb-cli --raw SADD ${STAGE_ID}_SECRETS $* > /dev/null )
}

function stageSecretExists() {
    ( { set +x; } 2>/dev/null; gigdb-cli --raw SISMEMBER ${STAGE_ID}_SECRETS "${1}" )
}

function stageSecrets() {
    ( { set +x; } 2>/dev/null; gigdb-cli --raw SMEMBERS ${STAGE_ID}_SECRETS )
}

function stageSecretsRemove() {
    ( { set +x; } 2>/dev/null; gigdb-cli --raw SREM ${STAGE_ID}_SECRETS $* > /dev/null )
}