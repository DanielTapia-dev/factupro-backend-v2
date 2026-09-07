#!/usr/bin/env python3
"""Run the built ARM64 image with temporary test credentials, no database."""
import json
import os
import secrets
import subprocess
import sys
import time
import urllib.request

image = sys.argv[1]
metadata = json.loads(subprocess.check_output(['docker', 'image', 'inspect', image], text=True))[0]
assert metadata['Architecture'] == 'arm64'
assert metadata['Config']['User'] == '1000:1000'
env = dict(os.environ, API_KEY=secrets.token_hex(32))
name = 'identity-smoke-' + secrets.token_hex(6)
try:
    subprocess.run(['docker', 'run', '-d', '--name', name, '--read-only', '--cap-drop=ALL',
                    '--security-opt=no-new-privileges:true', '--memory=400m', '--cpus=0.5',
                    '--tmpfs', '/tmp:size=32m,mode=1777', '-e', 'API_KEY',
                    '-p', '127.0.0.1::3000', image], env=env, check=True, stdout=subprocess.DEVNULL)
    port = subprocess.check_output(['docker', 'port', name, '3000/tcp'], text=True).strip().rsplit(':', 1)[1]
    for attempt in range(45):
        try:
            with urllib.request.urlopen(f'http://127.0.0.1:{port}/api/v1/health', timeout=2) as response:
                assert json.load(response)['status'] == 'ok'
            break
        except OSError:
            time.sleep(1)
    else:
        raise RuntimeError('ARM64 application did not become healthy')
    try:
        urllib.request.urlopen(f'http://127.0.0.1:{port}/api/v1/ciudadano/cedula/fixture', timeout=2)
        raise AssertionError('Unauthenticated request accepted')
    except urllib.error.HTTPError as exc:
        assert exc.code == 401
    subprocess.run(['docker', 'exec', name, 'node', '-e',
                    "if(Object.keys(process.env).some(k=>k.startsWith('DB_')||k==='DATABASE_URL'))process.exit(1);try{require.resolve('pg');process.exit(1)}catch{}"], check=True)
    subprocess.run(['docker', 'stop', '--time', '10', name], check=True, stdout=subprocess.DEVNULL)
    state = json.loads(subprocess.check_output(['docker', 'inspect', name], text=True))[0]['State']
    assert state['ExitCode'] == 0 and not state['OOMKilled'], state['ExitCode']
    print('ARM64 smoke passed: health, authentication boundary, no database and graceful shutdown')
finally:
    subprocess.run(['docker', 'rm', '-f', name], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
