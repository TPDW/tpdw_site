import datetime

from django.db import models

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
    title = models.CharField(max_length=100)
    url = models.URLField(max_length=200)

class Degree(Qualification):
    title_choices = [('MSc','MSc'),('BA','BA')]
    title = models.CharField(max_length=50, choices=title_choices)
    university = models.CharField(max_length=50)
    thesis = models.ForeignKey(Thesis, on_delete=models.CASCADE)
