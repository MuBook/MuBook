import json as JSON
import sys

from django.http import HttpResponse


def devlog(data):
    print >> sys.stderr, data


def ajax(*args, **kwargs):
    resp = HttpResponse(*args, **kwargs)
    resp["Access-Control-Allow-Origin"] = "*"
    resp["Access-Control-Allow-Methods"] = "GET, POST"
    resp["Access-Control-Max-Age"] = "1000"
    resp["Access-Control-Allow-Headers"] = "*"
    return resp


def json(hash, *args, **kwargs):
    return ajax(JSON.dumps(hash), *args, content_type="application/json", **kwargs)

