from django.conf.urls import patterns, url

urlpatterns = patterns('xbook.ajax',
	url(r'^u-(?P<uni>.*?)/prereq/(?P<code>.*?)$', 'views.subject'),
	url(r'^p/u-(?P<uni>.*?)/prereq/(?P<code>.*?)$', 'views.subject', { 'pretty': True }),

	url(r'^u-(?P<uni>.*?)/postreq/(?P<code>.*?)$', 'views.subject', { 'prereq': False }),
	url(r'^p/u-(?P<uni>.*?)/postreq/(?P<code>.*?)$', 'views.subject', { 'pretty': True, 'prereq': False }),

	url(r'^u-(?P<uni>.*?)/subjectlist/?$', 'views.subjectList'),
	url(r'^p/u-(?P<uni>.*?)/subjectlist/?$', 'views.subjectList', {'pretty': True}),
)
