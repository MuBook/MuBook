from django.db import models

# Create your models here.
class Subject(models.Model):
	name = models.CharField(max_length=100)
	code = models.CharField(max_length=20)
	credit = models.DecimalField(max_digits=5, decimal_places=2)
	prescribed_textbook = models.CharField(max_length=200, blank=True)
	assessment = models.CharField(max_length=200)
	link = models.URLField()

class Course(models.Model):
	name = models.CharField(max_length=100)
	code = models.CharField(max_length=20)
	requirements = models.CharField(max_length=1000)
	atar_cutoff = models.DecimalField(max_digits=5, decimal_places=2)
	link = models.URLField()

class Major(models.Model):
	name = models.CharField(max_length=100)
	credit_requirement = models.DecimalField(max_digits=5, decimal_places=2)
	course = models.ForeignKey(Subject)

class SubjectPrereq(models.Model):
	subject = models.ForeignKey(Subject, related_name='master')
	prereq = models.ForeignKey(Subject, related_name='servant')

class MajorRequirement(models.Model):
	major = models.ForeignKey(Major)
	required = models.ForeignKey(Subject)
