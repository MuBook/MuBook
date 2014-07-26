import json

from collections import deque
from django.http import HttpResponse
from django.core.exceptions import ObjectDoesNotExist
from django.views.decorators.cache import cache_page
from xbook.ajax.models import Subject, SubjectPrereq


def Ajax(*args, **kwargs):
	resp = HttpResponse(*args, **kwargs)
	resp['Access-Control-Allow-Origin'] = '*'
	resp["Access-Control-Allow-Methods"] = "POST, GET, OPTIONS"
	resp["Access-Control-Max-Age"] = "1000"
	resp["Access-Control-Allow-Headers"] = "*"
	return resp


def subjectGraphCollector(uni, code, prereq=True):
	graph = { "nodes": [], "links": [] }
	subjQueue = deque()

	try:
		subject = Subject.objects.get(code=code)
		subjQueue.append(subject)
	except ObjectDoesNotExist as e:
		nodes.append({ "name": "??" })
		return graph

	queryKey = prereq and "subject__code" or "prereq__code"
	queryParam = {}
	subjectRelation = prereq and \
		(lambda source, target: { "source": source, "target": target }) or \
		(lambda target, source: { "source": source, "target": target })
	relationGetter = prereq and \
		(lambda relation: relation.prereq) or \
		(lambda relation: relation.subject)

	nodes = graph['nodes']
	links = graph['links']

	parentIndex, codeToIndex = -1, { subject.code: 0 }
	while subjQueue:
		subj = subjQueue.popleft()
		nodes.append({
			"code": subj.code,
			"name": subj.name,
			"url": subj.link,
			"root": parentIndex == -1 and True or False,
			"credit": str(subj.credit),
			"commence_date": subj.commence_date,
			"time_commitment": subj.time_commitment,
			"overview": subj.overview,
			"objectives": subj.objectives,
			"assessment": subj.assessment,
			"prereq": subj.prerequisite,
			"coreq": subj.corequisite
		})
		parentIndex += 1
		queryParam[queryKey] = subj.code
		relations = SubjectPrereq.objects.filter(**queryParam)

		for relation in relations:
			seen = True
			related = relationGetter(relation)
			if not related.code in codeToIndex:
				seen = False
				codeToIndex[related.code] = len(codeToIndex)
			links.append(subjectRelation(parentIndex, codeToIndex[related.code]))
			if not seen:
				subjQueue.append(related)

	return graph


@cache_page(60 * 60 * 24)
def subject(request, uni, code, pretty=False, prereq=True):
	graph = subjectGraphCollector(uni, code.upper(), prereq)

	info = json.dumps(graph, indent=4 if pretty else None)

	return Ajax(
		ajaxCallback(request, info),
		content_type='application/json'
	)


def subjectListCollector(uni, pretty=False):
	d = {'subjList': []}
	l = d['subjList']

	for subj in Subject.objects.all():
		this = {'code': subj.code, 'name': subj.name}
		l.append(this)

	return json.dumps(d, indent=4 if pretty else None)


@cache_page(60 * 60 * 24)
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
