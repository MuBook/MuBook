# Create your views here.
import os
from django.core.mail import send_mail

from django.http import HttpResponse
# from django.shortcuts import render

CURRENT_PATH = os.path.dirname(os.path.abspath(__file__))
INDEX_PATH = os.path.join(
    os.path.join(CURRENT_PATH, 'templates'),
    'index.html'
)

f = open(INDEX_PATH)
INDEX_CACHE = f.read()
f.close()
del f


def index(request):
    # use this when doing local testing
    # with open(INDEX_PATH) as index:
    #     return HttpResponse(index.read())

    #use this when pushing to remote
    return HttpResponse(INDEX_CACHE)


def error404(request, path):
    message = request.META.get('REMOTE_ADDR') + '/' + \
              path + " is not a valid path!"
    return HttpResponse(message)


def ngView(request):
    return HttpResponse('<div id="graph"></div>')


def send_feedback(request):
    message = request.GET.get('message')
    name = request.GET.get('name')
    email = request.GET.get('email')
    body = 'from: ' + name + '\n' + 'email: ' + email + '\n' + 'message: ' + message
    send_mail('A Feedback here', body, 'xbookfeedback@gmail.com',
              ['xbookfeedback@gmail.com'], fail_silently=False)
    return HttpResponse("OK")


