import os
import json

from django.http import HttpResponse
from django.core.mail import send_mail
from django.views.decorators.http import require_POST
from django.views.decorators.cache import cache_page
from django.views.decorators.csrf import csrf_protect
from django.shortcuts import render_to_response, render, redirect
from django.template import RequestContext
from django.contrib.auth.models import User
from xbook.ajax.models import Subject
from xbook.front.models import UserSubject

CURRENT_PATH = os.path.dirname(os.path.abspath(__file__))
INDEX_PATH = os.path.join(
    os.path.join(CURRENT_PATH, 'templates'),
    'index.html'
)

CONTACT_US = 1
PRIVACY_POLICY = 2
TERMS_SERVICE = 3


def index(request):
    return redirect('/explorer/')


@cache_page(60 * 60 * 24)
@csrf_protect
def explorer(request):
    is_social = request.user.is_authenticated() and request.user.socialaccount_set.count() > 0
    return render(request, "index.html", {'is_social': is_social})


def error404(request, path):
    return render(request, "404.html")


def ngView(request):
    return HttpResponse('<div id="graph"></div>')


@require_POST
def send_feedback(request):
    data = json.loads(request.body)
    name = data.get("name", "someone")
    email = data.get("email", "Email not given")
    message = data.get("message", "error")
    send_mail("Feedback from " + name, email + "\n\n" + message, "xbookfeedback@gmail.com",
              ["xbookfeedback@gmail.com"], fail_silently=False)
    return HttpResponse("OK")


def user_profile(request, username):
    user = User.objects.get(username=username)
    assert isinstance(user, User)
    user_subjects = user.user_subject.all()
    context = RequestContext(request, {
        'user_subjects': user_subjects,
    })
    return render_to_response("user_profile.html", context)


def add_subject(request):
    if not request.user.is_authenticated():
        return HttpResponse(
            "You can only add subjects if you are logged in. \
            Please log in or sign up through the buttons at the top.")

    current_user = request.user
    subject_code = request.POST["subject"]
    subject_year = request.POST["year"]
    subject_state = request.POST["state"]
    subject_semester = request.POST["semester"]

    if not subject_code and not subject_year and not subject_state and not subject_semester:
        return HttpResponse("Error: Bad payload.")

    selected_subject = Subject.objects.filter(code=subject_code)[0]

    UserSubject.add(current_user, selected_subject,
                    subject_year, subject_semester,
                    subject_state)

    return HttpResponse("Success")


def delete_subject(request, subject):
    if not request.user.is_authenticated():
        return HttpResponse("You can only delete subject if you are logged in.")

    user = request.user
    subject = Subject.objects.get(code=subject)

    if not len(UserSubject.objects.filter(user=user, subject=subject)):
        return HttpResponse("Sorry, you have not stared this subject")

    user_subject = UserSubject.objects.filter(user=user, subject=subject)[0]

    user_subject.delete()

    return HttpResponse("Successfully deleted subject")

def site_general(request):
    bold = make_bold(CONTACT_US)
    context = RequestContext(request, {
        "bold": bold
    })
    return render_to_response("site_general.html", context)

def site_tos(request):
    bold = make_bold(TERMS_SERVICE)
    context = RequestContext(request, {
        "bold": bold
    })
    return render_to_response("site_tos.html", context)

def site_pp(request):
    bold = make_bold(PRIVACY_POLICY)
    context = RequestContext(request, {
        "bold": bold
    })
    return render_to_response("site_pp.html", context)

def make_bold(page):
    general = ""
    privacy_policy = ""
    terms_of_service = ""
    if page == CONTACT_US:
        general = "active"
    elif page == PRIVACY_POLICY:
        privacy_policy = "active"
    elif page == TERMS_SERVICE:
        terms_of_service = "active"
    return {
        "site_general": general,
        "site_pp": privacy_policy,
        "site_tos": terms_of_service
    }
