from django.db import models

class Subject(models.Model):
	name = models.CharField(max_length=100)
	code = models.CharField(max_length=20, db_index=True)
	# credit = models.DecimalField(max_digits=5, decimal_places=2)
	# prescribed_textbook = models.CharField(max_length=200, blank=True)
	# assessment = models.CharField(max_length=2000)
	prereq_text = models.CharField(max_length=500, blank=True)
	link = models.URLField()

	def __unicode__(self):
		return self.code

class Course(models.Model):
	name = models.CharField(max_length=100)
	code = models.CharField(max_length=20)
	requirements = models.CharField(max_length=1000)
	atar_cutoff = models.DecimalField(max_digits=5, decimal_places=2)
	link = models.URLField()

	def __unicode__(self):
		return self.code

class Major(models.Model):
	name = models.CharField(max_length=100)
	credit_requirement = models.DecimalField(max_digits=5, decimal_places=2)
	course = models.ForeignKey(Course)

	def __unicode__(self):
		return self.name

class SubjectPrereq(models.Model):
	subject = models.ForeignKey(Subject, related_name='master')
	prereq = models.ForeignKey(Subject, related_name='servant')

	def __unicode__(self):
		return self.subject.code + ": " + self.prereq.code

class NonallowedSubject(models.Model):
	subject = models.ForeignKey(Subject, related_name='blade')
	non_allowed = models.ForeignKey(Subject, related_name='enemy')

	def __unicode__(self):
		return self.subject.code + " X " + self.non_allowed.code

class MajorRequirement(models.Model):
	major = models.ForeignKey(Major)
	required = models.ForeignKey(Subject)

	def __unicode__(self):
		return self.major.name + ": " + self.required.code
