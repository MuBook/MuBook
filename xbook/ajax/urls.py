from django.conf.urls import patterns, url
from xbook.ajax import views

urlpatterns = [
	url(r"^u-(?P<uni>.*?)/prereq/(?P<code>.*?)$", views.subject),
	url(r"^u-(?P<uni>.*?)/postreq/(?P<code>.*?)$", views.subject, { "prereq": False }),

	url(r"^u-(?P<uni>.*?)/subjectlist/?$", views.subjectList),

  url(r"^profile/(?P<username>.*?)/?$", views.get_user_subject)
]
