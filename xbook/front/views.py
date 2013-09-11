# Create your views here.
from django.http import HttpResponse
import os
# from shortcuts import render

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
	# return render(request, )
	return HttpResponse(INDEX_CACHE)

def error404(request, path):
	message = request.META.get('REMOTE_ADDR') + '/' +\
		path + " is not a valid path!"
	return HttpResponse(message)