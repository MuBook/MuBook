# Create your views here.
import os.path
import json

from django.http import HttpResponse
from django.core.exceptions import ObjectDoesNotExist
from xbook.ajax.models import Subject, SubjectPrereq, NonallowedSubject

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

def subjectCollector(uni, code, parent=None):
	d = {}
	try:
		subject = Subject.objects.get(code=code)
	except ObjectDoesNotExist as e:
		return {"name": "??"}
	d['name'] = subject.code
	d['fullname'] = subject.name
	prereqs = SubjectPrereq.objects.filter(subject__code=code)
	if len(prereqs) > 0:
		ch = d['children'] = []
		for pair in prereqs:
			if pair.prereq.code == parent: continue
			ch.append(subjectCollector(uni, pair.prereq.code, code))
	return d

def subject(request, uni, code, pretty=False):
	return Ajax(
		json.dumps(
			subjectCollector(uni, code.upper()),
			indent=4 if pretty else None
		),
		content_type='application/json'
	)
