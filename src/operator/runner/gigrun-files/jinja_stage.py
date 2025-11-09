import sys
import os
from json import load
from yaml import safe_load, safe_load_all

from jinja2 import Environment, FileSystemLoader

gigrun_home = os.environ['GIG_RUN_HOME']
gigrun_working_dir = os.environ['GIG_RUN_WORKING_DIR']
environment = Environment(loader = FileSystemLoader([gigrun_working_dir, gigrun_home, '/']))
environment.filters['from_json'] = load
environment.filters['from_yaml'] = safe_load
environment.filters['from_yaml_all'] = safe_load_all

template = environment.get_template(sys.argv[1])

output = template.render(env=os.environ, cli_args=sys.argv[2:])
with open(f'{gigrun_working_dir}/{os.path.basename(sys.argv[2])}', 'w') as rendered_file:
    rendered_file.write(output)
