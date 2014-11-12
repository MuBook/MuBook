from django.conf.urls import patterns, url
from xbook.ajax import views

urlpatterns = [
    url(r"^u-(?P<uni>.*?)/prereq/(?P<code>.*?)$", views.subject_graph),
    url(r"^u-(?P<uni>.*?)/postreq/(?P<code>.*?)$", views.subject_graph, { "prereq": False }),

    url(r"^u-(?P<uni>.*?)/subjectlist$", views.subjectList),

    url(r"subjects/(?P<subjectCode>\w+?)/statistics", views.subject_statistics),

    url(r"^profile/(?P<username>.*?)/?$", views.get_user_subject)
]
