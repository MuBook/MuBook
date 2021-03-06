import os
import json as JSON

from django.http import HttpResponse
from django.core.mail import send_mail
from django.views.decorators.http import require_POST
from django.views.decorators.cache import cache_page
from django.views.decorators.csrf import csrf_protect
from django.shortcuts import render, redirect
from django.template import RequestContext

from shared.utils import devlog
from shared.response import r200, r201, r400, r401, r404

from xbook.ajax.models import Subject
from xbook.front.models import UserSubject

CONTACT_US = 1
PRIVACY_POLICY = 2
TERMS_SERVICE = 3


@cache_page(60 * 60 * 24)
@csrf_protect
def explorer(request):
    isSocial = request.user.is_authenticated() and request.user.socialaccount_set.count() > 0
    return render(request, "index.html", { "isSocial": isSocial })


def error404(request, path):
    return render(request, "404.html")


@require_POST
def send_feedback(request):
    data = JSON.loads(request.body)
    name = data.get("name", "someone")
    email = data.get("email", "Email not given")
    message = data.get("message", "error")
    send_mail("Feedback from " + name, email + "\n\n" + message, "xbookfeedback@gmail.com",
              ["xbookfeedback@gmail.com"], fail_silently=False)
    return r200()


@require_POST
def add_subject(request):
    if not request.user.is_authenticated():
        return r401()

    currentUser     = request.user
    payload         = JSON.loads(request.body)
    subjectCode     = payload["subject"]
    subjectYear     = payload["year"]
    subjectState    = payload["state"]
    subjectSemester = payload["semester"]

    if not subjectCode or not subjectYear or not subjectState or not subjectSemester:
        return r400()

    try:
        selectedSubject = Subject.objects.get(code=subjectCode)
    except Subject.DoesNotExist:
        return r404()

    UserSubject.add(currentUser, selectedSubject, subjectYear, subjectSemester, subjectState)

    return r201()


@require_POST
def delete_subject(request, subject):
    if not request.user.is_authenticated():
        return r401()

    user = request.user
    subject = Subject.objects.get(code=subject)

    try:
        relation = UserSubject.objects.get(user=user, subject=subject)
    except UserSubject.DoesNotExist:
        return r404()

    relation.delete()

    return HttpResponse()

def site(request, which):
    return render(request, "site_{}.html".format(which), { which: True })
