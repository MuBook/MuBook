from django.conf.urls import patterns, include, url

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
from django.contrib.auth.views import logout
from django.views.generic import RedirectView
admin.autodiscover()

urlpatterns = patterns('',
    url(r'^accounts/logout/$', logout, {'next_page': '/'}),
    url(r'^accounts/', include('allauth.urls')),

    url(r'^(?P<path>(?:prereq|postreq)/.*)', RedirectView.as_view(url='/explorer/%(path)s')),
)

urlpatterns += patterns('xbook.front.views',
    url(r'^$', 'index', name='home'),
    url(r'^explorer/', 'explorer', name='explorer'),
    url(r'^ajax/', include('xbook.ajax.urls')),

    url(r'^profile/selected_subjects/add/$', 'add_subject'),
    url(r'^profile/selected_subjects/delete/(?P<subject>.*?)/$', 'delete_subject'),
    url(r'^profile/(?P<username>.*?)/$', 'user_profile', name='user_profile'),

    url(r'^site/general$', 'site_general', name='site_general'),
    url(r'^site/termsofservice$', 'site_tos', name='site_tos'),
    url(r'^site/privacypolicy$', 'site_pp', name='site_pp'),

    # Uncomment the next line to enable the admin:
    url(r'^admin/?', include(admin.site.urls)),

    url(r'^template$', 'ngView'),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    url(r'^feedback$', 'send_feedback'),

    url(r'^(.*?)$', 'error404'),
)
