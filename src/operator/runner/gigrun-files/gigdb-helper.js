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
	gigdb.connect();
	console.log('gigdb connected')
} catch (err) {
    gigdbQuit(err);
}

global.gigEnvExists = async (field) => {
	let result = await gigdb.hExists(GIG_ENV, field);
	console.log('gigEnvExists(' + field + ') => ' + result);
	return result;
}

global.gigEnvGet = async (field) => {
	let result = await gigdb.hGet(GIG_ENV, field);
	console.log('gigEnvGet(' + field + ') => ' + result);
	return result;
}

global.gigEnvToJson = async () => {
	let result = json.dumps(await gigEnvToDict());
	console.log('gigEnvToJson() => ' + result);
	return result;
}

global.gigEnvKeys = async () => {
	let result = await gigdb.hKeys(GIG_ENV);
	console.log('gigEnvKeys() => ' + result);
	return result;
}

global.gigEnvToDict = async () => {
	let result = await gigdb.hGetAll(GIG_ENV);
	console.log('gigEnvToDict() => ' + result);
	return result;
}

global.gigEnvSet = async (field, value) => {gigSecretsRemove
	await gigdb.hSet(GIG_ENV, field, value)
	console.log('gigEnvSet(' + field + ', ' + value + ')');
}

global.gigEnvValues = async () => {
	let result = await gigdb.hVals(GIG_ENV);
	console.log('gigEnvValues() => ' + result);
	return result;
}

global.stageEnvExists = async (field) => {
	let result = await gigdb.hExists(STAGE_ID, field);
	console.log('stageEnvExists(' + field + ') => ' + result);
	return result;
}

global.stageEnvGet = async (field) => {
	let result = await gigdb.hGet(STAGE_ID, field);
	console.log('stageEnvGet(' + field + ') => ' + result);
	return result;
}

global.stageEnvToJson = async () => {
	let result = json.dumps(await stageEnvToDict());
	console.log('stageEnvToJson() => ' + result);
	return result;
}

global.stageEnvKeys = async () => {
	let result = await gigdb.hKeys(STAGE_ID);
	console.log('stageEnvKeys() => ' + result);
	return result;
}

global.stageEnvToDict = async () => {
	let result = await gigdb.hGetAll(STAGE_ID);
	console.log('stageEnvToDict() => ' + result);
	return result;
}

global.stageEnvSet = async (field, value) => {
	await gigdb.hSet(STAGE_ID, field, value)
	console.log('stageEnvSet(' + field + ', ' + value + ')');
}

global.stageEnvValues = async () => {
	let result = await gigdb.hVals(STAGE_ID);
	console.log('stageEnvValues() => ' + result);
	return result;
}

global.stepEnvExists = async (field) => {
	let result = await gigdb.hExists(STEP_ID, field);
	console.log('stepEnvExists(' + field + ') => ' + result);
	return result;
}

global.stepEnvGet = async (field) => {
	let result = await gigdb.hGet(STEP_ID, field);
	console.log('stepEnvGet(' + field + ') => ' + result);
	return result;
}

global.stepEnvToJson = async () => {
	let result = json.dumps(await gigEnvToDict());
	console.log('stepEnvToJson() => ' + result);
	return result;
}

global.stepEnvKeys = async () => {
	let result = await gigdb.hKeys(STEP_ID);
	console.log('stepEnvKeys() => ' + result);
	return result;
}

global.stepEnvToDict = async () => {
	let result = await gigdb.hGetAll(STEP_ID);
	console.log('stepEnvToDict() => ' + result);
	return result;
}

global.stepEnvSet = async (field, value) => {
	await gigdb.hSet(STEP_ID, field, value)
	console.log('stepEnvSet(' + field + ', ' + value + ')');
}

global.stepEnvValues = async () => {
	let result = await gigdb.hVals(STEP_ID);
	console.log('stageEnvValues() => ' + result);
	return result;
}

global.gigSecretsAdd = async (members) => {
	await gigdb.sAdd(GIG_SECRETS, members);
}

global.gigSecretExists = async (field) => {
	let result = await gigdb.sIsMember(GIG_SECRETS, field);
	return result;
}

global.gigSecrets = async () => {
	let result =  await gigdb.sMembers(GIG_SECRETS);
	return result;
}

global.gigSecretsRemove = async (field) => {
	await gigdb.sRem(GIG_SECRETS, field);
}

global.stageSecretsAdd = async (members) => {
	await gigdb.sAdd(STAGE_SECRETS, members);
}

global.stageSecretExists = async (field) => {
	let result = await gigdb.sIsMember(STAGE_SECRETS, field);
	return result;
}

global.stageSecrets = async () => {
	let result =  await gigdb.sMembers(STAGE_SECRETS);
	return result;
}

global.stageSecretsRemove = async (field) => {
	await gigdb.sRem(STAGE_SECRETS, field);
}

global.stepSecretsAdd = async (members) => {
	await gigdb.sAdd(STEP_SECRETS, members);
}

global.stepSecretExists = async (field) => {
	let result = await gigdb.sIsMember(STEP_SECRETS, field);
	return result;
}

global.stepSecrets = async () => {
	let result = await gigdb.sMembers(STEP_SECRETS);
	return result;
}

global.stepSecretsRemove = async (field) => {
	await gigdb.sRem(STEP_SECRETS, field);
}


