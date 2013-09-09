# Create your views here.
from django.http import HttpResponse
# import json
import os.path

BASE_PATH = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_PATH, 'data')

def Ajax(*args, **kwargs):
	resp = HttpResponse(*args, **kwargs)
	resp['Access-Control-Allow-Origin'] = '*'
	resp["Access-Control-Allow-Methods"] = "POST, GET, OPTIONS"
	resp["Access-Control-Max-Age"] = "1000"
	resp["Access-Control-Allow-Headers"] = "*"
	return resp

def ajaxJSON(request, json="testdata.json"):
	try:
		with open(os.path.join(DATA_PATH, json)) as f:
			resp = Ajax(f.read(), content_type='application/json')
			return resp
	except:
		print(json + " is requested but does not exist")
		return HttpResponse('{"name": "??"}')
