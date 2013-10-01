# Create your views here.
import os.path
import json
import zlib

from collections import deque

from django.http import HttpResponse
from django.core.exceptions import ObjectDoesNotExist
from xbook.ajax.models import Subject, SubjectPrereq, NonallowedSubject

BASE_PATH = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_PATH, 'data')


class Memo(object):

	def __init__(self, f):
		self.call = f
		self.memo = {}

	def __call__(self, *args):
		if args in self.memo:
			return self.memo[args]
		rt = self.memo[args] = self.call(*args)
		return rt


class MemoString(Memo):

	def __call__(self, *args):
		if args in self.memo:
			return zlib.decompress(self.memo[args])
		rt = self.call(*args)
		self.memo[args] = zlib.compress(rt)
		return rt


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


@Memo
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

	index, parent = 0, -1
	temp = {}
	while ss:
		parent += 1
		subj = ss.popleft()
		nodes.append({
			"code": subj.code,
			"name": subj.name,
			"url": subj.link,
			"root": index == 0 and True or False
		})
		prereqs = SubjectPrereq.objects.filter(subject__code=subj.code)

		for prereq in prereqs:
			if not prereq.prereq in ssHistory:
				index += 1
				temp[prereq.prereq.code] = index
			links.append({
				"source": parent,
				"target": temp[prereq.prereq.code],
				"value": 1
			})
			if prereq.prereq in ssHistory:
				continue
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
			if pair.prereq.code == parent:
				continue
			ch.append(subjectCollector(uni, pair.prereq.code, code))
	return d


def subject(request, uni, code, pretty=False):
	info = json.dumps(
		subjectGraphCollector(uni, code.upper()),
		indent=4 if pretty else None
	)
	return Ajax(
		ajaxCallback(request, info),
		content_type='application/json'
	)


@MemoString
def subjectListCollector(uni, pretty=False):
	d = {'subjList': []}
	l = d['subjList']

	for subj in Subject.objects.all():
		this = {'code': subj.code, 'name': subj.name}
		l.append(this)

	return json.dumps(d, indent=4 if pretty else None)


def subjectList(request, uni, pretty=False):
	return Ajax(
		ajaxCallback(request, subjectListCollector(uni, pretty)),
		content_type='application/json'
	)


def ajaxCallback(request, info):
	if "callback" in request.GET:
		return request.GET['callback'] + "({})".format(info)
	else:
		return info
