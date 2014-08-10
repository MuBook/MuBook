from django.contrib.auth.models import User
from django.test import TestCase
from xbook.ajax.models import Subject, UserSubject

class TestUserSubject(TestCase):
    def setUp(self):
        self.subj = Subject.objects.create(name="Subj1", code="comp90009", credit=12.50)
        self.user = User.objects.create(username="testing")
        self.user_subject = UserSubject.objects.create(subject=self.subj,
                                                       user=self.user,
                                                       year=2014,
                                                       semester='Semester 1',
                                                       state='Completed')

    def test_subject_exist(self):
        self.assertEqual(self.user_subject.subject,self.subj)
