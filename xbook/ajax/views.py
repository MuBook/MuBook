import json

from collections import deque
from allauth.socialaccount.models import SocialToken
from allauth.socialaccount.models import SocialAccount
from django.http import HttpResponse
from django.core.exceptions import ObjectDoesNotExist
from django.views.decorators.cache import cache_page
from django.contrib.auth.models import User
from xbook.ajax.models import Subject, SubjectPrereq
from xbook.front.models import UserSubject
from facepy import GraphAPI

BOOKMARKED = "Bookmarked"
COMPLETED = "Completed"
STUDYING = "Studying"
PLANNED = "Planned"


def Ajax(*args, **kwargs):
    resp = HttpResponse(*args, **kwargs)
    resp["Access-Control-Allow-Origin"] = "*"
    resp["Access-Control-Allow-Methods"] = "POST, GET, OPTIONS"
    resp["Access-Control-Max-Age"] = "1000"
    resp["Access-Control-Allow-Headers"] = "*"
    return resp


# return uid of users who mark "subject" as "state"
def subject_state_uids(subj, state):
    return map((lambda x: x.user.socialaccount_set.all()[0].uid),
               filter((lambda x: x.user.socialaccount_set.count() > 0),
                      UserSubject.objects.filter(subject=subj, state=state)))


def get_friends_info(local_friends_uids, subj, state):
    friends_info = []
    for uid in local_friends_uids:
        if uid in subject_state_uids(subj, state):
            social_account = SocialAccount.objects.filter(uid=uid)[0]
            user = social_account.user
            friends_info.append({"fullname": user.get_full_name(),
                                 "avatar_url": social_account.get_avatar_url(),
                                 "fb_url": social_account.get_profile_url(),
                                 "username": user.username})
    return friends_info


def social_statistics(friends, subj):
    friends_uids = map((lambda x: x.get("id")), friends)
    local_facebook_uids = map((lambda x: x.uid), SocialAccount.objects.filter(provider="facebook"))
    local_friends_uids = filter(lambda x: x in friends_uids, local_facebook_uids)

    friends_info_planned = get_friends_info(local_friends_uids, subj, PLANNED)
    friends_info_studying = get_friends_info(local_friends_uids, subj, STUDYING)
    friends_info_completed = get_friends_info(local_friends_uids, subj, COMPLETED)
    friends_info_bookmarked = get_friends_info(local_friends_uids, subj, BOOKMARKED)

    return {"friendsInfoPlanned": friends_info_planned,
            "friendsInfoStudying": friends_info_studying,
            "friendsInfoCompleted": friends_info_completed,
            "friendsInfoBookmarked": friends_info_bookmarked}


def attach_social_statistics(friends, nodeinfo, subj):
    if friends:
        nodeinfo.update(social_statistics(friends, subj))


def get_friends(user):
    friends = None
    if user.is_authenticated():
        tokens = SocialToken.objects.filter(account__user=user, account__provider="facebook")
        if tokens:
            fb_graph = GraphAPI(tokens[0])
            friends = fb_graph.get("me/friends").get("data")
    return friends


def attach_user_info(nodeinfo, subj, user):
    if not user.is_authenticated() or \
        not len(UserSubject.objects.filter(user=user, subject=subj)):
        nodeinfo.update({"hasCompleted": False})
    else:
        user_subject = UserSubject.objects.filter(user=user, subject=subj)[0]
        nodeinfo.update({
            "hasCompleted": True,
            "yearCompleted": user_subject.year,
            "semesterCompleted": user_subject.semester,
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

    nodes = graph["nodes"]
    links = graph["links"]

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
            "commenceDate": subj.commence_date,
            "timeCommitment": subj.time_commitment,
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
        content_type="application/json"
    )


def subjectListCollector(uni, pretty=False):
    d = {"subjList": []}
    l = d["subjList"]

    for subj in Subject.objects.all():
        this = {"code": subj.code, "name": subj.name}
        l.append(this)

    return json.dumps(d, indent=4 if pretty else None)


@cache_page(60 * 60 * 24)
def subjectList(request, uni, pretty=False):
    return Ajax(
        ajaxCallback(request, subjectListCollector(uni, pretty)),
        content_type="application/json"
    )


def ajaxCallback(request, info):
    if "callback" in request.GET:
        return request.GET["callback"] + "({})".format(info)
    else:
        return info


def attach_statistics(nodeinfo, subj):
    num_planned = UserSubject.objects.filter(subject=subj, state=PLANNED).count()
    num_studying = UserSubject.objects.filter(subject=subj, state=STUDYING).count()
    num_completed = UserSubject.objects.filter(subject=subj, state=COMPLETED).count()
    num_bookmarked = UserSubject.objects.filter(subject=subj, state=BOOKMARKED).count()

    nodeinfo.update({"numPlanned": num_planned,
                     "numStudying": num_studying,
                     "numCompleted": num_completed,
                     "numBookmarked": num_bookmarked})


def attach_userinfo_node(user):
    def name_or_account():
        if user.first_name and user.last_name:
            return user.first_name + " " + user.last_name
        elif user.first_name:
            return user.first_name
        elif user.last_name:
            return user.last_name
        else:
            return user.username

    return {
        "code": name_or_account(),
        "name": name_or_account(),
        "root": True,
        "credit": "",
        "commenceDate": "",
        "timeCommitment": "",
        "overview": "",
        "objectives": "",
        "assessment": "",
        "prereq": "",
        "coreq": "",
        "isUserNode": True,
        "hasCompleted": False,
        "yearCompleted": 0,
        "semesterCompleted": "",
        "state": "",
        "numPlanned": 0,
        "numStudying": 0,
        "numCompleted": 0,
        "numBookmarked": 0,
        "friendsInfoPlanned": 0,
        "friendsInfoStudying": 0,
        "friendsInfoCompleted": 0,
        "friendsInfoBookmarked": 0
    }


def get_user_subject(request, username, pretty=False):
    graph = { "nodes": [], "links": [] }

    if not len(User.objects.filter(username=username)):
        return Ajax(
            ajaxCallback(request, json.dumps(graph)),
            content_type="application/json"
        )

    selected_user = User.objects.filter(username=username)[0]
    user_subjects = selected_user.user_subject.all()

    add_link = lambda source, target: {"source": source, "target": target}

    nodes = graph["nodes"]
    links = graph["links"]

    friends = get_friends(selected_user)
    parent_index = -1
    for user_subject in user_subjects:
        subj = user_subject.subject

        nodeinfo = {
            "code": subj.code,
            "name": subj.name,
            "url": subj.link,
            "root": False,
            "credit": str(subj.credit),
            "commenceDate": subj.commence_date,
            "timeCommitment": subj.time_commitment,
            "overview": subj.overview,
            "objectives": subj.objectives,
            "assessment": subj.assessment,
            "prereq": subj.prerequisite,
            "coreq": subj.corequisite
        }

        attach_user_info(nodeinfo, subj, selected_user)
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

    nodes.append(attach_userinfo_node(selected_user))

    info = json.dumps(graph, indent=4 if pretty else None)

    return Ajax(
        ajaxCallback(request, info),
        content_type="application/json"
    )
