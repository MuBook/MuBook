from django.contrib import admin
from xbook.ajax.models import \
	Subject, Major, Course, MajorRequirement, SubjectPrereq, NonallowedSubject

admin.site.register(Subject)
admin.site.register(Major)
admin.site.register(Course)
admin.site.register(MajorRequirement)
admin.site.register(SubjectPrereq)
admin.site.register(NonallowedSubject)
