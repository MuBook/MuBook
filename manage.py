#!/usr/bin/env python
import os
import re
import sys

def read_env():
    try:
        with open('.env') as f:
            content = f.read()
    except:
        return

    for line in content.splitlines():
        pair = re.match(r'^([A-Z_]+)=(.*)$', line)

        if pair:
            key, val = pair.group(1), pair.group(2)
        else:
            continue

        quoted_value = re.match(r'''^(?P<quote>'|")(?P<content>.*)(?P=quote)$''', val)
        if quoted_value:
            val = quoted_value.groupdict()['content']

        os.environ.setdefault(key, val)

if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "xbook.settings")

    from django.core.management import execute_from_command_line

    read_env()
    execute_from_command_line(sys.argv)
