from django.conf.urls import patterns, include, url

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
from django.contrib.auth.views import logout
admin.autodiscover()

urlpatterns = patterns('',
    url(r'^accounts/logout/$', logout, {'next_page': '/'}),
    url(r'^accounts/', include('allauth.urls')),
)

urlpatterns += patterns('xbook.front.views',
    url(r'^$', 'index', name='home'),
    url(r'^ajax/', include('xbook.ajax.urls')),

    url(r'^profile/selected_subjects/add/$', 'add_subject'),
    url(r'^profile/(?P<username>.*?)/$', 'user_profile', name='user_profile'),

    # Uncomment the next line to enable the admin:
    url(r'^admin/?', include(admin.site.urls)),

    url(r'^template$', 'ngView'),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    url(r'^feedback$', 'send_feedback'),
    
    url(r'(?:prereq|postreq)/.*', 'index'),

    url(r'^(.*?)$', 'error404'),
)
