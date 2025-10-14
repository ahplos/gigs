import sys
import os
from json import load
from yaml import safe_load, safe_load_all

from jinja2 import Environment, FileSystemLoader

USER_INPUT_PATCH = 'USER_INPUT_PATCH'
USER_INPUT_PATCH_J2 = 'user_input_patch.j2'
USER_INPUT_PATCH_YAML = 'user_input_patch.yaml'

gigrunner_home = os.environ['GIG_RUNNER_HOME']
gigrunner_working_dir = os.environ['GIG_RUNNER_WORKING_DIR']
environment = Environment(loader = FileSystemLoader([gigrunner_working_dir, gigrunner_home, '/']))
environment.filters['from_json'] = load
environment.filters['from_yaml'] = safe_load
environment.filters['from_yaml_all'] = safe_load_all

print("Arguments:", sys.argv[1:])
template_file = sys.argv[1]
template = None
is_user_input = os.path.isfile(f'{gigrunner_working_dir}/{template_file}')
if (is_user_input):
    template = environment.get_template(USER_INPUT_PATCH_J2)
else:
    template = environment.get_template(sys.argv[1])

os.environ[USER_INPUT_PATCH] = sys.argv[1]
output = template.render(env=os.environ)

out_filename = USER_INPUT_PATCH_YAML if is_user_input else sys.argv[1]
with open(f'{gigrunner_working_dir}/{os.path.basename(out_filename)}', 'w') as rendered_file:
    rendered_file.write(output)
