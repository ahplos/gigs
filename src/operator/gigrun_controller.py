import asyncio
import datetime
import json
import logging
import random
import os

import kopf
from kr8s.objects import CronJob
from gig_types import GigRun, GigDefinition, Gig

WORKING_DIR = os.path.join(os.path.curdir, 'WORKING_DIR')

@kopf.on.create(GigRun.singular, GigRun.version)
def on_create(meta, spec, namespace, logger, body, **kwargs):
    gig = GigRun.get(meta.name)

    gig_dir = os.path.join(WORKING_DIR, namespace, gig.name)
    if (os.path.isdir(gig_dir)):
        os.rmdir(gig_dir)
    os.makedirs(gig_dir)

    gig_def = GigDefinition(gig.gigDefinitionRef)

    for stage, index in gig_def.stages:
        script_file_name = f'{index:03}-{stage.name}'
        with open(script_file_name, 'w') as script_file:
            script_file.write(stage.script)

        os.chmod(script_file_name, 0o0777)



@kopf.on.update('batch.teknetes.org', 'v1beta1', 'gigruns')
def on_update(body, diff, spec, status, namespace, logger, **kwargs):
    logger.warn(f'========== UPDATE ===============')
    logger.warn('body:')
    logger.warn(f'{body}')
    logger.warn(f'-------------------------')
    logger.warn('diff:')
    logger.warn(f'{diff}')
    logger.warn(f'========== UPDATE END ===========')