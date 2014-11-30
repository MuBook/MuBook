from django.conf.urls import patterns, url
from xbook.ajax import views

urlpatterns = [
    url(r"^u-(?P<uni>.*?)/prereq/(?P<code>.*?)$", views.subject_graph),
    url(r"^u-(?P<uni>.*?)/postreq/(?P<code>.*?)$", views.subject_graph, { "prereq": False }),

    url(r"^u-(?P<uni>.*?)/(?P<code>.*?)/details$", views.subject_detail),

    url(r"^u-(?P<uni>.*?)/subject_list$", views.subject_list),

    url(r"subjects/(?P<subjectCode>\w+?)/general_statistics", views.subject_statistics),
    url(r"subjects/(?P<subjectCode>\w+?)/social_statistics", views.social_statistics),
    url(r"my_subjects/(?P<subjectCode>\w+)", views.user_subject),

    url(r"^profile/(?P<username>.*?)/?$", views.profile)
]
