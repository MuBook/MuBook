from django.conf.urls import patterns, include, url

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('xbook.front.views',
    # Examples:
    # url(r'^$', 'xbook.views.home', name='home'),
    # url(r'^xbook/', include('xbook.foo.urls')),
    url(r'^$', 'index'),
    url(r'^ajax/', include('xbook.ajax.urls')),

    # Uncomment the next line to enable the admin:
    url(r'^admin/?', include(admin.site.urls)),

    url(r'^template', 'ngView'),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    url(r'^send_feedback/$', 'send_feedback'),

    url(r'^(.*?)$', 'error404'),
)
