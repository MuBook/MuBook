import os.path
import json
import zlib

from collections import deque

from django.http import HttpResponse
from django.core.exceptions import ObjectDoesNotExist
from xbook.ajax.models import Subject, SubjectPrereq, NonallowedSubject


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
			# return self.memo[args]
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


@Memo
def subjectGraphCollector(uni, code):
	d = { "nodes": [], "links": [] }
	subjQueue = deque()

	nodes = d['nodes']
	links = d['links']

	try:
		subject = Subject.objects.get(code=code)
		subjQueue.append(subject)
	except ObjectDoesNotExist as e:
		nodes.append({ "name": "??" })
		return d

	parent, codeToIndex = -1, { subject.code: 0 }
	while subjQueue:
		subj = subjQueue.popleft()
		nodes.append({
			"code": subj.code,
			"name": subj.name,
			"url": subj.link,
			"root": parent == -1 and True or False
		})
		parent += 1
		prereqs = SubjectPrereq.objects.filter(subject__code=subj.code)

		for prereq in prereqs:
			seen = True
			if not prereq.prereq.code in codeToIndex:
				seen = False
				codeToIndex[prereq.prereq.code] = len(codeToIndex)
			links.append({
				"source": parent,
				"target": codeToIndex[prereq.prereq.code],
				"value": 1
			})
			if not seen:
				subjQueue.append(prereq.prereq)

	return d

@Memo
def postrequisiteGraph(uni, code):
	d = {"nodes": [], "links": []}
	subjQueue, subjHistory = deque(), set()

	nodes = d['nodes']
	links = d['links']

	try:
		subject = Subject.objects.get(code=code)
		subjQueue.append(subject)
	except ObjectDoesNotExist as e:
		nodes.append({"name": "??"})
		return d

	index, parent = 0, -1
	while subjQueue:
		parent += 1
		subj = subjQueue.popleft()
		nodes.append({
			"code": subj.code,
			"name": subj.name,
			"url": subj.link,
			"root": index == 0 and True or False
		})
		prereqs = SubjectPrereq.objects.filter(prereq__code=subj.code)

		for prereq in prereqs:
			if prereq.subject in subjHistory:
				continue
			index += 1
			links.append({
				"source": index,
				"target": parent,
				"value": 1
			})
			subjQueue.append(prereq.subject)
			subjHistory.add(prereq.subject)

	return d


def subject(request, uni, code, pretty=False, postreq=False):
	if postreq:
		data = postrequisiteGraph(uni, code.upper())
	else:
		data = subjectGraphCollector(uni, code.upper())

	info = json.dumps(data, indent=4 if pretty else None)

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
