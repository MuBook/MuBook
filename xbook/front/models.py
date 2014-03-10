from django.contrib.auth.models import User
from xbook.ajax.models import Subject
from django.db import models
from allauth.account.models import EmailAddress

class UserProfile(models.Model):
    user = models.OneToOneField(User, related_name='profile')
    selected_subjects = models.ManyToManyField(Subject, related_name='profiles')

    def __unicode__(self):
        return "{}'s profile".format(self.user.username)

    class Meta:
        db_table = 'user_profile'

    def account_verified(self):
        if self.user.is_authenticated:
            result = EmailAddress.objects.filter(email=self.user.email)
            if len(result):
                return result[0].verified
        return False

    def selected_subject(self):
        if len(self.selected_subjects.all()):
            return [subj.code + " " + subj.name  for subj in self.selected_subjects.all()]
        else:
            return ["You haven't selected any subjects now."]

    def add_subject(self, code):
        subject = Subject.objects.filter(code=code)
        if len(subject):
            self.selected_subjects.add(subject[0])


User.profile = property(lambda u: UserProfile.objects.get_or_create(user=u)[0])
