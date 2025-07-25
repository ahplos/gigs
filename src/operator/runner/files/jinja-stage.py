import sys
import os
from json import load

from jinja2 import Environment, FileSystemLoader

import kopf


environment = Environment(loader = FileSystemLoader(['{{ GIG_RUNNER_DIR }}', '{{ GIG_RUNNER_WORKING_DIR }}']))
environment.filters['from_json'] = load
template = environment.get_template(sys.argv[1])

output = template.render(os.environ)

with open(f'/{{ GIG_RUNNER_WORKING_DIR }}/{sys.argv[1]}', 'w') as rendered_file:
    rendered_file.write(output)