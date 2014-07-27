import os
import json

from django.http import HttpResponse
from django.shortcuts import render, redirect
from django.core.mail import send_mail
from django.views.decorators.http import require_POST
from django.views.decorators.cache import cache_page
from django.views.decorators.csrf import csrf_protect
from django.shortcuts import render_to_response
from django.template import RequestContext
from django.contrib.auth.models import User
from allauth.account.decorators import verified_email_required
from xbook.ajax.models import UserSubject, Subject

CURRENT_PATH = os.path.dirname(os.path.abspath(__file__))
INDEX_PATH = os.path.join(
    os.path.join(CURRENT_PATH, 'templates'),
    'index.html'
)

# Comment out the following line for testing index.html
@cache_page(60 * 60 * 24)
@csrf_protect
def index(request):
    return render(request, "index.html")


def error404(request, path):
    message = request.META.get('REMOTE_ADDR') + '/' + \
              path + " is not a valid path!"
    return HttpResponse(message)


def ngView(request):
    return HttpResponse('<div id="graph"></div>')


@require_POST
def sendFeedback(request):
    data = json.loads(request.body)
    name = data.get("name", "someone")
    email = data.get("email", "Email not given")
    message = data.get("message", "error")
    send_mail("Feedback from " + name, email + "\n\n" + message, "xbookfeedback@gmail.com",
              ["xbookfeedback@gmail.com"], fail_silently=False)
    return HttpResponse("OK")

def user_profile(request, username):
    user = User.objects.get(username=username)
    context = RequestContext(request, {
        'visited_user': user,
    })
    return render_to_response("user_profile.html", context)

def add_subject(request, code):
    profile = request.user.profile
    try:
        profile.add_subject(code)
    except Exception:
        return redirect('home')

    payload = {'add': 'ok'}
    return HttpResponse(json.dumps(payload), mimetype="application/json")

def addSubject(request):
    if not request.user.is_authenticated():
        return HttpResponse("Error: Un-authorized user.")

    current_user = request.user
    subject_code = request.POST["subject"]
    subject_year = request.POST["year"]
    subject_state = request.POST["state"]
    semester = request.POST["semester"]

    if not subject_code and not subject_year and not subject_state and not semester:
        return HttpResponse("Error: Bad payload.")

    selected_subject = Subject.objects.filter(code=subject_code)[0]

    u_s = UserSubject(
        subject = selected_subject,
        user = current_user,
        year = subject_year,
        state = subject_state,
        semester = semester
    )

    u_s.save()

    return HttpResponse("Success")
