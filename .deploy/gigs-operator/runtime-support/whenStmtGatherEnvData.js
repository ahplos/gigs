import { createClient } from 'redis';

export async function gatherEnvData() {
    const env = {...process.env}

    const gigdb = createClient();
    await gigdb.connect();
    const gigEnv = await gigdb.hGetAll('GIG_ENV');
    const stageEnv = env.STAGE_ID ? await gigdb.hGetAll(env.STAGE_ID) : {}
    let tmpStepEnv = {}
    if (env.STEP_ID) {
        tmpStepEnv = env.STAGE_ID ? await gigdb.hGetAll(env.STEP_ID) : {}
    }
    const stepEnv = tmpStepEnv
    await gigdb.quit();

    return [env, gigEnv, stageEnv, stepEnv]
}