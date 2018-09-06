
import os
import subprocess
import sys
import time

from contextlib import contextmanager

from typing import (Any, Iterator, Optional)

# Verify the Zulip venv is available.
from tools.lib import sanity_check
sanity_check.check_venv(__file__)

import django
import requests

TOOLS_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if TOOLS_DIR not in sys.path:
    sys.path.insert(0, os.path.dirname(TOOLS_DIR))

from zerver.lib.test_fixtures import run_generate_fixtures_if_required

def set_up_django(external_host):
    # type: (str) -> None
    os.environ['EXTERNAL_HOST'] = external_host
    os.environ["TORNADO_SERVER"] = "http://127.0.0.1:9983"
    os.environ['DJANGO_SETTINGS_MODULE'] = 'zproject.test_settings'
    django.setup()
    os.environ['PYTHONUNBUFFERED'] = 'y'

def assert_server_running(server):
    # type: (subprocess.Popen) -> None
    """Get the exit code of the server, or None if it is still running."""
    if server.poll() is not None:
        message = 'Server died unexpectedly!'
        raise RuntimeError(message)

def server_is_up(server):
    # type: (subprocess.Popen) -> bool
    assert_server_running(server)
    try:
        # We could get a 501 error if the reverse proxy is up but the Django app isn't.
        return requests.get('http://127.0.0.1:9981/accounts/home').status_code == 200
    except Exception:
        return False

@contextmanager
def test_server_running(force: bool=False, external_host: str='testserver',
                        use_db: bool=True
                        ) -> Iterator[None]:
    set_up_django(external_host)

    if use_db:
        run_generate_fixtures_if_required()

    # Run this not through the shell, so that we have the actual PID.
    run_dev_server_command = ['tools/run-dev.py', '--test']
    if force:
        run_dev_server_command.append('--force')
    server = subprocess.Popen(run_dev_server_command)

    try:
        # Wait for the server to start up.
        sys.stdout.write('\nWaiting for test server (may take a while)')
        sys.stdout.write('\n\n')
        while not server_is_up(server):
            time.sleep(0.1)
        sys.stdout.write('\n\n--- SERVER IS UP! ---\n\n')

        # DO OUR ACTUAL TESTING HERE!!!
        yield

    finally:
        assert_server_running(server)
        server.terminate()

if __name__ == '__main__':
    # The code below is for testing this module works
    with test_server_running():
        print('\n\n SERVER IS UP!\n\n')
