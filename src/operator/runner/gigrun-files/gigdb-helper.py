import os
import json

import redis

GIG_ENV = "GIG_ENV"

GIG_SECRETS = "GIG_SECRETS"

STAGE_ID = os.getenv("STAGE_ID")

STEP_ID = os.getenv("STEP_ID")

STAGE_SECRETS = STAGE_ID + "_SECRETS"

gigdb = redis.Redis(host='localhost', port=6379, decode_responses=True)

def gigEnvExists(field: str):
	return gigdb.hexists(GIG_ENV, field)

def gigEnvGet(field: str):
	return gigdb.hget(GIG_ENV, field)

def gigEnvToJson():
	gig_env = gigEnvToDict()
	return json.dumps(gig_env)

def gigEnvKeys():
	return gigdb.hkeys(GIG_ENV)

def gigEnvToDict():
	return gigdb.hegetall(GIG_ENV)

def gigEnvSet(field: str, value: str):
	return gigdb.hget(GIG_ENV, field, value)

def gigEnvValues():
	return gigdb.hvals(GIG_ENV)

def stageEnvExists(field: str):
	return gigdb.hexists(STAGE_ID, field)

def stageEnvGet(field: str):
	return gigdb.hget(STAGE_ID, field)

def stageEnvToJson():
	gig_env = gigEnvToDict()
	return json.dumps(gig_env)

def stageEnvKeys():
	return gigdb.hkeys(STAGE_ID)

def stageEnvToDict():
	return gigdb.hegetall(STAGE_ID)

def stageEnvSet(field: str, value: str):
	return gigdb.hget(STAGE_ID, field, value)

def stagegEnvValues():
	return gigdb.hvals(STAGE_ID)

def stepEnvExists(field: str):
	return gigdb.hexists(STEP_ID, field)

def stepEnvGet(field: str):
	return gigdb.hget(STEP_ID, field)

def stepEnvToJson():
	gig_env = gigEnvToDict()
	return json.dumps(gig_env)

def stepEnvKeys():
	return gigdb.hkeys(STEP_ID)

def stepEnvToDict():
	return gigdb.hegetall(STEP_ID)

def stepEnvSet(field: str, value: str):
	return gigdb.hget(STEP_ID, field, value)

def stepEnvValues():
	return gigdb.hvals(STEP_ID)

def stageSecretsAdd(*members: str):
	gigdb.sadd(GIG_ENV, members)

def stageSecretExists(field: str):
	return gigdb.sismember(GIG_ENV, field)

def stageSecrets():
	return gigdb.smembers(GIG_ENV)

def stageSecretsRemove(field: str):
	return gigdb.srem(GIG_ENV, field)
