import {
    k8sCreate,
    K8sModel,
} from '@openshift-console/dynamic-plugin-sdk';

const jobModel: K8sModel = {
    abbr: '',
    apiGroup: 'batch',
    apiVersion: 'v1',
    id: 'job',
    kind: 'Job',
    label: 'Job',
    labelPlural: 'Jobs',
    namespaced: true,
    plural: 'jobs',
};

const createJob = (cronJobObj: object, formStateObj: object) => {
    let cronJob: any = cronJobObj instanceof Map ? Object.fromEntries(cronJobObj) : cronJobObj;
    let formState: any = formStateObj instanceof Map ? Object.fromEntries(formStateObj) : formStateObj;

    const job = structuredClone(cronJob.spec.jobTemplate.spec);
    job.template.spec.containers[0].args ??= [];

    job.template.spec.containers[0].env ??= []
    let env = job.template.spec.containers[0].env
    let arg = `echo "Job ${cronJob.metadata.name} has been set with the following environment values:"`
    for (const [key, value] of Object.entries(formState)) {
        if (key) {
            env.push({
                name: key,
                value: (value instanceof Object ? JSON.stringify(value) : value.toString())
            });

            arg += ` && echo "    ${key} == \${${key}}"`;
        }
    };
    job.template.spec.containers[0].args[0] = arg

    var data = {
        apiVersion: 'batch/v1',
        kind: 'Job',
        metadata: {
            generateName: `${cronJob.metadata.name}-`,
            namespace: cronJob.metadata.namespace,
            ownerReferences: [{
                apiVersion: cronJob.apiVersion,
                kind: cronJob.kind,
                name: cronJob.metadata.name,
                uid: cronJob.metadata.uid,
            }]
        },
        spec: job
    };

    try {
        let jobResult = k8sCreate({
            model: jobModel,
            data: data
        });

        JSON.stringify(`job created: ${jobResult}`);
    }
    catch(err) {
        console.error(`Failed to create Job:`, err);
    };



};

export default createJob;