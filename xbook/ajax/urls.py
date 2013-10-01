from django.conf.urls import patterns, url

urlpatterns = patterns('xbook.ajax',
	url(r'^test', 'views.ajaxJSON'),
	url(r'^(?P<json>.*?\.json)$', 'views.ajaxJSON'),

	url(r'^u-(?P<uni>.*?)/subject/(?P<code>.*?)$', 'views.subject'),
	url(r'^p/u-(?P<uni>.*?)/subject/(?P<code>.*?)$',
		'views.subject', {'pretty': True}),

	url(r'^u-(?P<uni>.*?)/subjectlist/?$', 'views.subjectList'),
	url(r'^p/u-(?P<uni>.*?)/subjectlist/?$',
		'views.subjectList', {'pretty': True}),
)
