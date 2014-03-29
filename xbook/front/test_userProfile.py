from django.contrib.auth.models import User
from django.test import TestCase
from xbook.ajax.models import Subject
from xbook.front.models import UserProfile


class TestUserProfile(TestCase):
    def setUp(self):
        self.subj1 = Subject.objects.create(name="Subj1", code="comp90009", credit=12.50)
        self.subj2 = Subject.objects.create(name="Subj2", code="comp90010", credit=12.50)
        user = User(id=2)
        self.user_profile = UserProfile.objects.create(user=user)

    def test_add_subject(self):
        self.assertEqual(list(self.user_profile.selected_subjects.all()), [])
        self.user_profile.add_subject("comp90009")
        self.user_profile.add_subject("comp90010")
        self.assertEqual(list(self.user_profile.selected_subjects.all()), [self.subj1, self.subj2])

    def test_add_invalid_subject_code(self):
        self.user_profile.add_subject("comp90002")
        self.assertEqual(list(self.user_profile.selected_subjects.all()), [])

    def test_duplicate_add(self):
        self.user_profile.add_subject("comp90009")
        self.user_profile.add_subject("comp90009")
        self.assertEqual(len(self.user_profile.selected_subjects.all()), 1)
        self.assertEqual(list(self.user_profile.selected_subjects.all()), [self.subj1])
