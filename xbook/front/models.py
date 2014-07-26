from django.contrib.auth.models import User
from xbook.ajax.models import Subject
from django.db import models


class UserSubject(models.Model):
    user = models.ForeignKey(User, related_name='user_subject')
    subject = models.ForeignKey(Subject)
    year = models.IntegerField()
    semester = models.CharField(max_length=20)
    state = models.CharField(max_length=20)

    @staticmethod
    def add(user, subject, year, semester, state):
        try:
            user_subject = UserSubject.objects.filter(user=user, subject=subject)[0]
            user_subject.year = year
            user_subject.semester = semester
            user_subject.state = state
        except Exception:
            user_subject = UserSubject(user=user, subject=subject, year=year, semester=semester, state=state)
        user_subject.save()



