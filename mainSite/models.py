import datetime
import uuid

from django.db import models
from django.db.models.functions import Cast

# Create your models here.

class Qualification(models.Model):
    date_acquired = models.DateField()
    subject = models.CharField(max_length=50)
    grade = models.CharField(max_length=50)
    title = ''
    class Meta:
        abstract = True
    def __str__(self):
        return '{} {}'.format(self.title, self.subject)

class GCSE(Qualification):
    title = 'GCSE'
    date_acquired = models.DateField(default = datetime.date(2010,7,1))
    grade_choices = [("A*","A*"),("A","A"),("B","B")]
    grade = models.CharField(max_length=2, choices=grade_choices)

class A_level(Qualification):
    title = 'A Level'
    date_acquired = models.DateField(default = datetime.date(2012,7,1))
    grade_choices = [("A*","A*"), ("A","A")]
    grade = models.CharField(max_length=2, choices=grade_choices)

class Thesis(models.Model):
    uuid = models.UUIDField( default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=100)
    #str_uuid = Cast(uuid,output_field=models.TextField)
    #upload_path = 'theses/{}/'.format(uuid)
    #upload_path = 'theses/'
    def upload_path(instance,filename):
        return f'theses/{instance.uuid}/{filename}'
    file = models.FileField(upload_to=upload_path,blank=True,null=True)

class Degree(Qualification):
    title_choices = [('MSc','MSc'),('BA','BA')]
    title = models.CharField(max_length=50, choices=title_choices)
    university = models.CharField(max_length=50)
    thesis = models.OneToOneField(Thesis, on_delete=models.CASCADE,blank=True,null=True)
