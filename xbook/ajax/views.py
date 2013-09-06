# Create your views here.
from django.http import HttpResponse
# import json
import os.path

BASE_PATH = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_PATH, 'data')

def test(request):
	with open(os.path.join(DATA_PATH, 'testdata.json')) as f:
		return HttpResponse(f.read(), mimetype='Application/json')
