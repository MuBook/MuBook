# -*- coding: utf-8 -*-
from south.utils import datetime_utils as datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'Subject'
        db.create_table(u'ajax_subject', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=100)),
            ('code', self.gf('django.db.models.fields.CharField')(max_length=20, db_index=True)),
            ('credit', self.gf('django.db.models.fields.DecimalField')(max_digits=5, decimal_places=2)),
            ('commence_date', self.gf('django.db.models.fields.TextField')()),
            ('time_commitment', self.gf('django.db.models.fields.TextField')()),
            ('overview', self.gf('django.db.models.fields.TextField')()),
            ('objectives', self.gf('django.db.models.fields.TextField')()),
            ('assessment', self.gf('django.db.models.fields.TextField')()),
            ('link', self.gf('django.db.models.fields.URLField')(max_length=200)),
            ('corequisite', self.gf('django.db.models.fields.TextField')()),
            ('prerequisite', self.gf('django.db.models.fields.TextField')()),
        ))
        db.send_create_signal(u'ajax', ['Subject'])

        # Adding model 'Course'
        db.create_table(u'ajax_course', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=100)),
            ('code', self.gf('django.db.models.fields.CharField')(max_length=20)),
            ('requirements', self.gf('django.db.models.fields.CharField')(max_length=1000)),
            ('atar_cutoff', self.gf('django.db.models.fields.DecimalField')(max_digits=5, decimal_places=2)),
            ('link', self.gf('django.db.models.fields.URLField')(max_length=200)),
        ))
        db.send_create_signal(u'ajax', ['Course'])

        # Adding model 'Major'
        db.create_table(u'ajax_major', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=100)),
            ('credit_requirement', self.gf('django.db.models.fields.DecimalField')(max_digits=5, decimal_places=2)),
            ('course', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['ajax.Course'])),
        ))
        db.send_create_signal(u'ajax', ['Major'])

        # Adding model 'SubjectPrereq'
        db.create_table(u'ajax_subjectprereq', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('subject', self.gf('django.db.models.fields.related.ForeignKey')(related_name='master', to=orm['ajax.Subject'])),
            ('prereq', self.gf('django.db.models.fields.related.ForeignKey')(related_name='servant', to=orm['ajax.Subject'])),
        ))
        db.send_create_signal(u'ajax', ['SubjectPrereq'])

        # Adding model 'NonallowedSubject'
        db.create_table(u'ajax_nonallowedsubject', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('subject', self.gf('django.db.models.fields.related.ForeignKey')(related_name='blade', to=orm['ajax.Subject'])),
            ('non_allowed', self.gf('django.db.models.fields.related.ForeignKey')(related_name='enemy', to=orm['ajax.Subject'])),
        ))
        db.send_create_signal(u'ajax', ['NonallowedSubject'])

        # Adding model 'MajorRequirement'
        db.create_table(u'ajax_majorrequirement', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('major', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['ajax.Major'])),
            ('required', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['ajax.Subject'])),
        ))
        db.send_create_signal(u'ajax', ['MajorRequirement'])


    def backwards(self, orm):
        # Deleting model 'Subject'
        db.delete_table(u'ajax_subject')

        # Deleting model 'Course'
        db.delete_table(u'ajax_course')

        # Deleting model 'Major'
        db.delete_table(u'ajax_major')

        # Deleting model 'SubjectPrereq'
        db.delete_table(u'ajax_subjectprereq')

        # Deleting model 'NonallowedSubject'
        db.delete_table(u'ajax_nonallowedsubject')

        # Deleting model 'MajorRequirement'
        db.delete_table(u'ajax_majorrequirement')


    models = {
        u'ajax.course': {
            'Meta': {'object_name': 'Course'},
            'atar_cutoff': ('django.db.models.fields.DecimalField', [], {'max_digits': '5', 'decimal_places': '2'}),
            'code': ('django.db.models.fields.CharField', [], {'max_length': '20'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'link': ('django.db.models.fields.URLField', [], {'max_length': '200'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'requirements': ('django.db.models.fields.CharField', [], {'max_length': '1000'})
        },
        u'ajax.major': {
            'Meta': {'object_name': 'Major'},
            'course': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['ajax.Course']"}),
            'credit_requirement': ('django.db.models.fields.DecimalField', [], {'max_digits': '5', 'decimal_places': '2'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100'})
        },
        u'ajax.majorrequirement': {
            'Meta': {'object_name': 'MajorRequirement'},
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'major': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['ajax.Major']"}),
            'required': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['ajax.Subject']"})
        },
        u'ajax.nonallowedsubject': {
            'Meta': {'object_name': 'NonallowedSubject'},
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'non_allowed': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'enemy'", 'to': u"orm['ajax.Subject']"}),
            'subject': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'blade'", 'to': u"orm['ajax.Subject']"})
        },
        u'ajax.subject': {
            'Meta': {'object_name': 'Subject'},
            'assessment': ('django.db.models.fields.TextField', [], {}),
            'code': ('django.db.models.fields.CharField', [], {'max_length': '20', 'db_index': 'True'}),
            'commence_date': ('django.db.models.fields.TextField', [], {}),
            'corequisite': ('django.db.models.fields.TextField', [], {}),
            'credit': ('django.db.models.fields.DecimalField', [], {'max_digits': '5', 'decimal_places': '2'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'link': ('django.db.models.fields.URLField', [], {'max_length': '200'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'objectives': ('django.db.models.fields.TextField', [], {}),
            'overview': ('django.db.models.fields.TextField', [], {}),
            'prerequisite': ('django.db.models.fields.TextField', [], {}),
            'time_commitment': ('django.db.models.fields.TextField', [], {})
        },
        u'ajax.subjectprereq': {
            'Meta': {'object_name': 'SubjectPrereq'},
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'prereq': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'servant'", 'to': u"orm['ajax.Subject']"}),
            'subject': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'master'", 'to': u"orm['ajax.Subject']"})
        }
    }

    complete_apps = ['ajax']