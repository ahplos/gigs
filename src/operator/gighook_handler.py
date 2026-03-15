import sys
import re
import base64
import hmac
import hashlib
import json
import logging

import jsonpath_ng

from enum import StrEnum

from kr8s.objects import Secret

from flask import Flask, request, abort, jsonify

import waitress

from utilities.gig_types import Gig, GigRun, GigHook

POST = 'POST'

CONTENT_TYPE = 'Content-Type'

APPLICATION_JSON = 'application/json'

gig_hooks_handler = Flask(__name__)

class GigHookSource(StrEnum):
    HEADER = 'Header'
    PAYLOAD = 'Payload'
    QUERYSTRING = 'QueryString'

class GigHookValidationType(StrEnum):
    REGEX = 'Regex'
    HMAC = 'HMAC'

logger = logging.getLogger('GigHooks')

@gig_hooks_handler.route('/gighooks/<namespace>/<name>', methods=['POST'])
def process_trigger(namespace, name):
    gig_hook = GigHook.get(name, namespace)
    gig = Gig.get(name, namespace)

    # request_path = f'{namespace}/{name}'
    logger.info(f'[{request.path}]: Request received')
    if (not (gig_hook.exists() and gig.exists())):
        logger.error(f'[{request.path}]: GigHook or Gig not found')
        abort(404)
    elif (not gig_hook.spec.isEnabled):
        logger.error(f'[{request.path}]: GigHook disabled')
        abort(503)
    else:
        input_values = {}
        payload = request.get_json()
        for event_value in gig_hook.spec.eventData:
            event_data = None
            match(event_value.source):
                case GigHookSource.HEADER:
                    event_data = request.headers.get(event_value.key)
                case GigHookSource.PAYLOAD:
                    jsonpath_expr = jsonpath_ng.parse(event_value.key)
                    event_data = jsonpath_expr.find(payload)
                    event_data = event_data[0].value if event_data else None
                case GigHookSource.QUERYSTRING:
                    event_data = request.args.get(event_value.key)

            log_data = event_data
            if (event_value.validation):
                validation = event_value.validation
                log_data = event_data if validation.type != GigHookValidationType.HMAC and not validation.secretKeyRef else '****'
                if (event_data is None or not validate_event(event_data, validation, namespace)):
                    logger.error(f'[{request.path}]: {{{event_value.key}: {log_data}}} validation FAILED')
                    abort(400)
                else:
                    logger.info(f'[{request.path}]: {{{event_value.key}: {log_data}}} validated')

            if (event_value.inputVar):
                input_values[event_value.inputVar] = event_data
                logger.info(f'[{request.path}]: {{{event_value.key}: {log_data}}} {event_value.inputVar} captured')

        status_code = 202
        gig_run = GigRun("", namespace = namespace)
        gig_run.metadata.generateName = f'{gig.name}-'
        gig_run.spec.gigRef.name = gig.name
        if (input_values):
            gig_run.spec.inputValues = json.dumps(input_values)
        gig_run.create()

        logger.info(f'[{request.path}]: GigRun {gig_run.namespace}/{gig_run.name} started')
        return jsonify(status_code=status_code)

def validate_event(event_data, validation, namespace):
    is_valid = False
    if (validation.bool is not None):
        is_valid = validation.bool == event_data
    else:
        test_value = validation.match
        if (not test_value):
            secret = Secret.get(validation.secretKeyRef.name, namespace = namespace)
            if (secret.exists()):
                test_value = secret.data.get(validation.secretKeyRef.key)
                test_value = base64.decodebytes(test_value.encode('ascii'))

        if (test_value):
            match(validation.type):
                case GigHookValidationType.HMAC:
                    hmac_value = hmac.new(test_value, request.get_data(), hashlib.sha256).hexdigest()
                    is_valid = event_data.find(hmac_value) > -1
                case _:
                    is_valid = re.match(test_value, event_data)

    return is_valid

if __name__ == '__main__':
    addr = sys.argv[2] if len(sys.argv) > 2 else '0.0.0.0'
    port = int(sys.argv[1])

    logger.setLevel(logging.INFO)
    handler = logging.StreamHandler(sys.stdout)
    formatter = logging.Formatter('%(levelname)s[%(asctime)s]%(message)s')
    handler.setFormatter(formatter)
    logger.propagate = False
    logger.addHandler(handler)

    logger.info(f'GigHook Handler starting on {addr}:{port}')
    sys.exit(waitress.serve(gig_hooks_handler, host=addr, port=port))

