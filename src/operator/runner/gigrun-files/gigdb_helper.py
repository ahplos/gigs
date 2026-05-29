import os
import json

import redis

GIG_ENV = "GIG_ENV"

STAGE_ID = os.getenv("STAGE_ID")

STEP_ID = os.getenv("STEP_ID")

GIG_SECRETS = "GIG_SECRETS"

STAGE_SECRETS = STAGE_ID + "_SECRETS"

STEP_SECRETS = STEP_ID + "_SECRETS"

gigdb = redis.Redis(host='localhost', port=6379, decode_responses=True)

def gigEnvExists(field: str):
	gigdb.hexists(GIG_ENV, field)

def gigEnvGet(field: str):
	result = gigdb.hget(GIG_ENV, field)
	return result if result else ''

def gigEnvToJson():
	gig_env = gigEnvToDict()
	return json.dumps(gig_env)

def gigEnvKeys():
	return gigdb.hkeys(GIG_ENV)

def gigEnvToDict():
	return gigdb.hegetall(GIG_ENV)

def gigEnvSet(field: str, value: str):
	return gigdb.hset(GIG_ENV, field, value)

def gigEnvValues():
	return gigdb.hvals(GIG_ENV)

def stageEnvExists(field: str):
	return gigdb.hexists(STAGE_ID, field)

def stageEnvGet(field: str):
	result = gigdb.hget(STAGE_ID, field)
	return result if result else ''

def stageEnvToJson():
	gig_env = gigEnvToDict()
	return json.dumps(gig_env)

def stageEnvKeys():
	return gigdb.hkeys(STAGE_ID)

def stageEnvToDict():
	return gigdb.hegetall(STAGE_ID)

def stageEnvSet(field: str, value: str):
	return gigdb.hset(STAGE_ID, field, value)

def stagegEnvValues():
	return gigdb.hvals(STAGE_ID)

def stepEnvExists(field: str):
	return gigdb.hexists(STEP_ID, field)

def stepEnvGet(field: str):
	result = gigdb.hget(STEP_ID, field)
	return result if result else ''

def stepEnvToJson():
	gig_env = gigEnvToDict()
	return json.dumps(gig_env)

def stepEnvKeys():
	return gigdb.hkeys(STEP_ID)

def stepEnvToDict():
	return gigdb.hegetall(STEP_ID)

def stepEnvSet(field: str, value: str):
	return gigdb.hset(STEP_ID, field, value)

def stepEnvValues():
	return gigdb.hvals(STEP_ID)

def gigSecretsAdd(*members: str):
	gigdb.sadd(GIG_SECRETS, members)

def gigSecretExists(field: str):
	return gigdb.sismember(GIG_SECRETS, field)

def gigSecrets():
	return gigdb.smembers(GIG_SECRETS)

def gigSecretsRemove(field: str):
	return gigdb.srem(GIG_SECRETS, field)

def stageSecretsAdd(*members: str):
	gigdb.sadd(STAGE_SECRETS, members)

def stageSecretExists(field: str):
	return gigdb.sismember(STAGE_SECRETS, field)

def stageSecrets():
	return gigdb.smembers(STAGE_SECRETS)

def stageSecretsRemove(field: str):
	return gigdb.srem(STAGE_SECRETS, field)

def stepSecretsAdd(*members: str):
	gigdb.sadd(STEP_SECRETS, members)

def stepSecretExists(field: str):
	return gigdb.sismember(STEP_SECRETS, field)

def stepSecrets():
	return gigdb.smembers(STEP_SECRETS)

def stepSecretsRemove(field: str):
	return gigdb.srem(STEP_SECRETS, field)
