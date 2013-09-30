# Create your views here.
import os.path
import json

from collections import deque

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

def subjectGraphCollector(uni, code):
	d = {"nodes": [], "links": []}
	ss, ssHistory = deque(), set()

	nodes = d['nodes']
	links = d['links']

	try:
		subject = Subject.objects.get(code=code)
		ss.append(subject)
	except ObjectDoesNotExist as e:
		nodes.append({"name": "??"})
		return d

	parent = -1
	index = 0
	while ss:
		parent += 1
		subj = ss.popleft()
		nodes.append({
			"name": subj.code,
			"fullname": subj.name,
			"url": subj.link,
			"root": index == 0 and True or False
		})
		prereqs = SubjectPrereq.objects.filter(subject__code=subj.code)

		for prereq in prereqs:
			if not prereq.prereq in ssHistory: index += 1
			links.append({"source": parent, "target": index, "value":1})
			if prereq.prereq in ssHistory: continue
			ss.append(prereq.prereq)
			ssHistory.add(prereq.prereq)

	return d

def subjectTreeCollector(uni, code, parent=None):
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
	info = json.dumps(
			subjectGraphCollector(uni, code.upper()),
			indent=4 if pretty else None
		)
	if "callback" in request.GET:
		format = request.GET['callback'] + "({})".format(info)
	else:
		format = info
	return Ajax(format, content_type='application/json')
