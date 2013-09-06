from django.conf.urls import patterns, url

urlpatterns = patterns('xbook.ajax',
	url(r'^test', 'views.test'),
)
