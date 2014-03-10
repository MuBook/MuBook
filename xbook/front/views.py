import os
import json

from django.http import HttpResponse
from django.shortcuts import render
from django.core.mail import send_mail
from django.views.decorators.http import require_POST
from django.views.decorators.cache import cache_page
from django.views.decorators.csrf import csrf_protect
from django.shortcuts import render_to_response
from django.template import RequestContext
from allauth.account.decorators import verified_email_required

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

def user_profile(request):
    return render_to_response("user_profile.html",
                              RequestContext(request))

def add_subject(request, code):
    profile = request.user.profile
    profile.add_subject(code)
    return render_to_response("user_profile.html",
                              RequestContext(request))
