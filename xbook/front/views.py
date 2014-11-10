import os
import json

from django.http import HttpResponse
from django.core.mail import send_mail
from django.views.decorators.http import require_POST
from django.views.decorators.cache import cache_page
from django.views.decorators.csrf import csrf_protect
from django.shortcuts import render, redirect
from django.template import RequestContext
from xbook.ajax.models import Subject
from xbook.front.models import UserSubject

CONTACT_US = 1
PRIVACY_POLICY = 2
TERMS_SERVICE = 3


@cache_page(60 * 60 * 24)
@csrf_protect
def explorer(request):
    is_social = request.user.is_authenticated() and request.user.socialaccount_set.count() > 0
    return render(request, "index.html", {'is_social': is_social})


def error404(request, path):
    return render(request, "404.html")


@require_POST
def send_feedback(request):
    data = json.loads(request.body)
    name = data.get("name", "someone")
    email = data.get("email", "Email not given")
    message = data.get("message", "error")
    send_mail("Feedback from " + name, email + "\n\n" + message, "xbookfeedback@gmail.com",
              ["xbookfeedback@gmail.com"], fail_silently=False)
    return HttpResponse()


def add_subject(request):
    if not request.user.is_authenticated():
        return HttpResponse(status=401)

    currentUser = request.user
    subjectCode = request.POST["subject"]
    subjectYear = request.POST["year"]
    subjectState = request.POST["state"]
    subjectSemester = request.POST["semester"]

    if not subjectCode or not subjectYear or not subjectState or not subjectSemester:
        return HttpResponse(status=400)

    try:
        selectedSubject = Subject.objects.get(code=subjectCode)
    except Subject.DoesNotExist:
        return HttpResponse(status=404)

    UserSubject.add(currentUser, selectedSubject, subjectYear, subjectSemester, subjectState)

    return HttpResponse(status=201)


def delete_subject(request, subject):
    if not request.user.is_authenticated():
        return HttpResponse(status=401)

    user = request.user
    subject = Subject.objects.get(code=subject)

    try:
        relation = UserSubject.objects.get(user=user, subject=subject)
    except UserSubject.DoesNotExist:
        return HttpResponse(status=404)

    relation.delete()

    return HttpResponse()

def site(request, which):
    return render(request, "site_{}.html".format(which), { which: True })
