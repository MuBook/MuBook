from django.conf.urls import patterns, include, url
from django.contrib.auth.views import logout
from django.views.generic import RedirectView

from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns("",
    url(r"^accounts/logout/$", logout, {"next_page": "/"}),
    url(r"^accounts/", include("allauth.urls")),

    url(r"^(?P<path>(?:prereq|postreq)/.*)", RedirectView.as_view(url="/explorer/%(path)s")),
)

urlpatterns += patterns("xbook.front.views",
    url(r"^$", "explorer"),
    url(r"^explorer/", "explorer", name="explorer"),
    url(r"^ajax/", include("xbook.ajax.urls")),

    url(r"^profile/subjects/add$", "add_subject"),
    url(r"^profile/subjects/delete/(?P<subject>.*?)$", "delete_subject"),
    url(r"^profile/.*?$", "explorer"),

    url(r"^site/general$", "site", { "which": "general" }, name="site_general"),
    url(r"^site/termsofservice$", "site", { "which": "tos" }, name="site_tos"),
    url(r"^site/privacypolicy$", "site", { "which": "pp" }, name="site_pp"),

    url(r"^admin/", include(admin.site.urls)),

    url(r"^feedback$", "send_feedback"),

    url(r"^(.*?)$", "error404"),
)
