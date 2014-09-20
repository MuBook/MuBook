import json
import sys

from collections import deque
from allauth.socialaccount.models import SocialToken
from django.http import HttpResponse
from django.core.exceptions import ObjectDoesNotExist
from django.views.decorators.cache import cache_page
from django.contrib.auth.models import User
from xbook.ajax.models import Subject, SubjectPrereq
from xbook.front.models import UserSubject
from facepy import GraphAPI

BOOKMARKED = 'Bookmarked'
COMPLETED = 'Completed'
STUDYING = 'Studying'
PLANNED = 'Planned'


def authenticate_user(func):
    def wrapper(*args, **kwargs):
        request = args[0]
        try:
            if request.user.is_authenticated():
                return func(*args, **kwargs)
            else:
                return Ajax(
                    ajaxCallback(request,
                                 json.dumps(
                                        {'error': 'Unauthorized',
                                         'errorCode': '401'}
                                )
                    ),
                    content_type='application/json'
                )
        except:
            return Ajax(
                    ajaxCallback(request,
                                 json.dumps(
                                        {'error': 'Bad Request',
                                         'errorCode': '400'}
                                )
                    ),
                    content_type='application/json'
                )
    return wrapper

def Ajax(*args, **kwargs):
    resp = HttpResponse(*args, **kwargs)
    resp['Access-Control-Allow-Origin'] = '*'
    resp["Access-Control-Allow-Methods"] = "POST, GET, OPTIONS"
    resp["Access-Control-Max-Age"] = "1000"
    resp["Access-Control-Allow-Headers"] = "*"
    return resp


def social_statistics(friends, subj):
    uids_from_provider = map((lambda x: x.get('id')), friends)
    user_subjects_planned = UserSubject.objects.filter(subject=subj, state=PLANNED)
    user_subjects_studying = UserSubject.objects.filter(subject=subj, state=STUDYING)
    user_subjects_completed = UserSubject.objects.filter(subject=subj, state=COMPLETED)
    user_subjects_bookmarked = UserSubject.objects.filter(subject=subj, state=BOOKMARKED)
    social_user_subjects_planned = filter((lambda x: x.user.socialaccount_set.count() > 0), user_subjects_planned)
    social_user_subjects_studying = filter((lambda x: x.user.socialaccount_set.count() > 0), user_subjects_studying)
    social_user_subjects_completed = filter((lambda x: x.user.socialaccount_set.count() > 0), user_subjects_completed)
    social_user_subjects_bookmarked = filter((lambda x: x.user.socialaccount_set.count() > 0), user_subjects_bookmarked)
    local_uids = map((lambda x: x.user.socialaccount_set.all()[0].uid), social_user_subjects_planned)
    local_uids2 = map((lambda x: x.user.socialaccount_set.all()[0].uid), social_user_subjects_studying)
    local_uids3 = map((lambda x: x.user.socialaccount_set.all()[0].uid), social_user_subjects_completed)
    local_uids4 = map((lambda x: x.user.socialaccount_set.all()[0].uid), social_user_subjects_bookmarked)
    num_friends_planned = len([uid for uid in uids_from_provider if uid in local_uids])
    num_friends_studying = len([uid for uid in uids_from_provider if uid in local_uids2])
    num_friends_completed = len([uid for uid in uids_from_provider if uid in local_uids3])
    num_friends_bookmarked = len([uid for uid in uids_from_provider if uid in local_uids4])
    return {'num_friends_planned': num_friends_planned,
            'num_friends_studying': num_friends_studying,
            'num_friends_completed': num_friends_completed,
            'num_friends_bookmarked': num_friends_bookmarked}


def attach_social_statistics(friends, nodeinfo, subj):
    if friends:
        nodeinfo.update(social_statistics(friends, subj))


def get_friends(user):
    friends = None
    if user.is_authenticated():
        tokens = SocialToken.objects.filter(account__user=user, account__provider='facebook')
        if tokens:
            fb_graph = GraphAPI(tokens[0])
            friends = fb_graph.get('me/friends').get('data')
    return friends


def attach_user_info(nodeinfo, subj, user):
    if not user.is_authenticated() or \
        not len(UserSubject.objects.filter(user=user, subject=subj)):
        nodeinfo.update({"has_completed": False})
    else:
        user_subject = UserSubject.objects.filter(user=user, subject=subj)[0]
        nodeinfo.update({
            "has_completed": True,
            "year_completed": user_subject.year,
            "semester_completed": user_subject.semester,
            "state": user_subject.state,
        })



def subject_graph(user, code, prereq=True):
    graph = { "nodes": [], "links": [] }
    subjQueue = deque()

    try:
        subject = Subject.objects.get(code=code)
        subjQueue.append(subject)
    except ObjectDoesNotExist:
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

    friends = get_friends(user)
    parentIndex, codeToIndex = -1, { subject.code: 0 }
    while subjQueue:
        subj = subjQueue.popleft()

        nodeinfo = {
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
        }

        attach_user_info(nodeinfo, subj, user)
        attach_statistics(nodeinfo, subj)
        attach_social_statistics(friends, nodeinfo, subj)
        nodes.append(nodeinfo)

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


def subject(request, uni, code, pretty=False, prereq=True):
    graph = subject_graph(request.user, code.upper(), prereq)

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


def attach_statistics(nodeinfo, subj):
    num_planned = UserSubject.objects.filter(subject=subj, state=PLANNED).count()
    num_studying = UserSubject.objects.filter(subject=subj, state=STUDYING).count()
    num_completed = UserSubject.objects.filter(subject=subj, state=COMPLETED).count()
    num_bookmarked = UserSubject.objects.filter(subject=subj, state=BOOKMARKED).count()

    nodeinfo.update({"num_planned": num_planned,
                     "num_studying": num_studying,
                     "num_completed": num_completed,
                     "num_bookmarked": num_bookmarked})


@authenticate_user
def get_user_subject(request, username, pretty=False):
    if not len(User.objects.filter(username=username)):
        return Ajax(
            ajaxCallback(request, json.dumps({})),
            content_type='application/json'
        )

    selected_user = User.objects.filter(username=username)[0]
    user_subjects = selected_user.user_subject.all()

    graph = { "nodes": [], "links": [] }

    add_link = lambda source, target: {"source": source, "target": target}

    nodes = graph['nodes']
    links = graph['links']

    friends = get_friends(selected_user)
    parent_index = -1
    for user_subject in user_subjects:
        subj = user_subject.subject

        nodeinfo = {
            "code": subj.code,
            "name": subj.name,
            "url": subj.link,
            "root": parent_index == -1 and True or False,
            "credit": str(subj.credit),
            "commence_date": subj.commence_date,
            "time_commitment": subj.time_commitment,
            "overview": subj.overview,
            "objectives": subj.objectives,
            "assessment": subj.assessment,
            "prereq": subj.prerequisite,
            "coreq": subj.corequisite,
            "has_completed": True,
            "year_completed": user_subject.year,
            "semester_completed": user_subject.semester,
            "state": user_subject.state
        }

        attach_statistics(nodeinfo, subj)
        attach_social_statistics(friends, nodeinfo, subj)
        nodes.append(nodeinfo)

        parent_index += 1
        relations = SubjectPrereq.objects.filter(subject__code=subj.code)

        for relation in relations:
            compare_index = 0
            for taken_subject in user_subjects:
                related = relation.prereq
                if taken_subject.subject.code == related.code:
                    links.append(add_link(parent_index, compare_index))
                compare_index += 1

    info = json.dumps(graph, indent=4 if pretty else None)

    return Ajax(
        ajaxCallback(request, info),
        content_type='application/json'
    )
