# Create your views here.
from django.http import HttpResponse
# import json
import os.path

BASE_PATH = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_PATH, 'data')

class Ajax(HttpResponse):
	def __init__(self, *args, **kwargs):
		super(Ajax, self).__init__(*args, **kwargs)
		self['Access-Control-Allow-Origin'] = '*'
		self["Access-Control-Allow-Methods"] = "POST, GET, OPTIONS"
		self["Access-Control-Max-Age"] = "1000"
		self["Access-Control-Allow-Headers"] = "*"

def test(request):
	with open(os.path.join(DATA_PATH, 'testdata.json')) as f:
		resp = Ajax(f.read(), content_type='application/json')
		return resp
