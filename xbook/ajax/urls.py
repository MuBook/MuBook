from django.conf.urls import patterns, url

urlpatterns = patterns('xbook.ajax',
	url(r'^test', 'views.ajaxJSON'),
	url(r'^(?P<json>.*?\.json)$', 'views.ajaxJSON'),
)
