import { createClient } from 'redis';

const GIG_ENV = "GIG_ENV"

const STAGE_ID = process.env["STAGE_ID"]

const STEP_ID = process.env["STEP_ID"]

const GIG_SECRETS = "GIG_SECRETS"

const STAGE_SECRETS = STAGE_ID + "_SECRETS"

const STEP_SECRETS = STEP_ID + "_SECRETS"

global.gigdb =  createClient();

function gigdbQuit(err) {
    if (gigdb.isReady) {
        gigdb.quit();
    }
	console.log(err);
	process.exit(1);
}

gigdb.on('error', err => {
    gigdbQuit(err);
});

process.on('uncaughtException', async (err) => {
    gigdbQuit(err);
});

try {
	await gigdb.connect();
} catch (err) {
    gigdbQuit(err);
}

global.gigEnvExists = async (field) => {
	return gigdb.hExists(GIG_ENV, field)
}

global.gigEnvGet = (field) => {
	return gigdb.hGet(GIG_ENV, field)
}

global.gigEnvToJson = async () => {
	gig_env = gigEnvToDict()
	return json.dumps(gig_env)
}

global.gigEnvKeys = async () => {
	return gigdb.hKeys(GIG_ENV)
}

global.gigEnvToDict = async () => {
	return gigdb.hGetAll(GIG_ENV)
}

global.gigEnvSet = (field, value) => {
	return gigdb.hSet(GIG_ENV, field, value)
}

global.gigEnvValues = async () => {
	return gigdb.hVals(GIG_ENV)
}

global.stageEnvExists = async (field) => {
	return gigdb.hExists(STAGE_ID, field)
}

global.stageEnvGet = async (field) => {
	return gigdb.hGet(STAGE_ID, field)
}

global.stageEnvToJson = async () => {
	gig_env = gigEnvToDict()
	return json.dumps(gig_env)
}

global.stageEnvKeys = async () => {
	return gigdb.hKeys(STAGE_ID)
}

global.stageEnvToDict = async () => {
	return gigdb.hGetAll(STAGE_ID)
}

global.stageEnvSet = async (field, value) => {
	return gigdb.hSet(STAGE_ID, field, value)
}

global.stagegEnvValues = async () => {
	return gigdb.hVals(STAGE_ID)
}

global.stepEnvExists = async (field) => {
	return gigdb.hExists(STEP_ID, field)
}

global.stepEnvGet = async (field) => {
	return gigdb.hGet(STEP_ID, field)
}

global.stepEnvToJson = async () => {
	gig_env = gigEnvToDict()
	return json.dumps(gig_env)
}

global.stepEnvKeys = async () => {
	return gigdb.hKeys(STEP_ID)
}

global.stepEnvToDict = async () => {
	return gigdb.hGetAll(STEP_ID)
}

global.stepEnvSet = async (field, value) => {
	return gigdb.hSet(STEP_ID, field, value)
}

global.stepEnvValues = async () => {
	return gigdb.hVals(STEP_ID)
}

global.gigSecretsAdd = async (members) => {
	await gigdb.sAdd(GIG_SECRETS, members)
}

global.gigSecretExists = async (field) => {
	return gigdb.sIsMember(GIG_SECRETS, field)
}

global.gigSecrets = async () => {
	return gigdb.sMembers(GIG_SECRETS)
}

global.gigSecretsRemove = async (field) => {
	return gigdb.sRem(GIG_SECRETS, field)
}

global.stageSecretsAdd = async (members) => {
	await gigdb.sAdd(STAGE_SECRETS, members)
}

global.stageSecretExists = async (field) => {
	return gigdb.sIsMember(STAGE_SECRETS, field)
}

global.stageSecrets = async () => {
	return gigdb.sMembers(STAGE_SECRETS)
}

global.stageSecretsRemove = async (field) => {
	return gigdb.sRem(STAGE_SECRETS, field)
}

global.stepSecretsAdd = async (members) => {
	return gigdb.sAdd(STEP_SECRETS, members)
}

global.stepSecretExists = async (field) => {
	return gigdb.sIsMember(STEP_SECRETS, field)
}

global.stepSecrets = async () => {
	return gigdb.sMembers(STEP_SECRETS)
}

global.stepSecretsRemove = async (field) => {
	return gigdb.sRem(STEP_SECRETS, field)
}

