from copy import deepcopy
import logging
import textwrap

import kopf

from box import Box, BoxList

from kr8s.objects import CronJob, ConfigMap, Job
from utilities.gig_types import GigRun, GigDefinition

GIG_RUN_DIR = f'{GigRun.singular}'
GIG_RUN_SH = f'{GigRun.singular}-controller.sh'
STAGE_LOG_SH = 'stage_log.sh'

GIG_DEFINITION_ANNOTATION = 'batch.tenknetes.org/gigdefinition'
WORKING_DIR_NAME_ANNOTATION = 'batch.tenknetes.org/workingdirname'

def create_job(cron_job: CronJob, gig_run: GigRun) -> Job:
    spec = deepcopy(cron_job.spec.jobTemplate)
    job = Job(spec)
    job.name = gig_run.name
    job.spec.template.spec['restartPolicy'] = 'Never'
    job.spec['backoffLimit'] = 0

    configmap_volume = Box(name = gig_run.name, configMap = Box(name = gig_run.name, defaultMode = 0o777))
    job.spec.template.spec.setdefault('volumes', BoxList()).append(configmap_volume)

    configmap_volume_mount = Box(name = gig_run.name, mountPath = f'/{GIG_RUN_DIR}')
    job.spec.template.spec.containers[0].setdefault('volumeMounts', BoxList()).append(configmap_volume_mount)
    job.spec.template.spec.containers[0]['imagePullPolicy'] = 'Always'

    set_job_working_dir(job, cron_job)

    job.spec.template.spec.containers[0].args = BoxList(
        [f'/{GIG_RUN_DIR}/{GIG_RUN_SH}']
    )

    job.create()
    job.set_owner(cron_job)

    return job

def get_container(job_template: Box, name = None) -> Box:
    container = job_template.spec.template.spec.containers[0]
    if(name):
        for named in job_template.spec.containers:
            if (named.name == name):
                container = named
                break
    return container

def set_job_working_dir(job: Job, cron_job: CronJob):
    working_dir = cron_job.annotations.get(WORKING_DIR_NAME_ANNOTATION)
    if (working_dir):
        for workingDir in job.spec.template.spec.containers[0].volumeMounts:
            if (workingDir.name == working_dir):
                job.spec.template.spec.containers[0].workingDir = workingDir.mountPath
                break
        if (not job.spec.template.spec.containers[0].get('workingDir')):
            msg = f'volumeMount NOT FOUND -> {WORKING_DIR_NAME_ANNOTATION}: {working_dir}'
            logging.error(msg)
            raise kopf.PermanentError(msg)
    else:
        working_dir = 'working-dir'
        working_dir_volume = Box(name = working_dir, emptyDir = Box(sizeLimit = '10Mi'))
        job.spec.template.spec.volumes.append(working_dir_volume)

        working_dir_volumemount = Box(name = working_dir, mountPath = f'/{working_dir}')
        job.spec.template.spec.containers[0].volumeMounts.append(working_dir_volumemount)
        job.spec.template.spec.containers[0].workingDir = working_dir

def create_gigrun_configmap(job: Job, gig_run: GigRun, gig_def: GigDefinition) -> ConfigMap:
    config_map = ConfigMap(gig_run.name, namespace=gig_run.namespace)
    config_map.data = {}

    gigdefName = gig_def.spec.get('name', gig_def.name)
    gigdefDescription = gig_def.spec.get('description')
    script = f'''\
        #!/usr/bin/bash
        echo 'kubectl version'
        echo
        kubectl version
        echo '======================='
        /{GIG_RUN_DIR}/{STAGE_LOG_SH} GIG '{gigdefName}' '{gigdefDescription if gigdefDescription else ''}'
        touch .env
    '''
    script = textwrap.dedent(script)

    for stage in gig_def.stages:
        stage_name = stage.get('displayName', stage.name)
        stage_description = stage.get('description')

        stage_command = stage.get('command')
        stage_script = stage.script
        if (stage_command):
            config_map.data[stage.name] = stage.script

            script_file = f'/{GIG_RUN_DIR}/{stage.name}'
            stage_script = stage_command.format(script_file)
        stage_script = textwrap.dedent(stage_script)

        script += '\n'
        prescript = f'''\
            set -o allexport
            source .env
            set +o allexport

            /{GIG_RUN_DIR}/{STAGE_LOG_SH} STAGE '{stage_name}' '{stage_description}'
        '''
        script += f'{textwrap.dedent(prescript)}\n'
        script += f'set -x\n\n{stage_script}\n\nset +x\n\n'
        script += f"kubectl wait gigrun/{gig_run.name} --for=jsonpath='{{.status.state}}'='Running' -n {gig_run.namespace}\n"

    config_map.data[GIG_RUN_SH] = script
    with open('./resources/stage_log.sh') as stage_log_script:
        config_map.data['stage_log.sh'] = stage_log_script.read()
    config_map.create()
    config_map.set_owner(job)

    return config_map