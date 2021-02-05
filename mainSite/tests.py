import os
from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from .models import GCSE, A_level, Degree, Thesis
# Create your tests here.

class GCSETestCase(TestCase):
    def setUp(self):
        GCSE.objects.create(subject='Physics', grade='A*')
        GCSE.objects.create(subject='English Language', grade='B')

    def test_strings(self):
        physics = GCSE.objects.get(subject='Physics')
        english = GCSE.objects.get(subject='English Language')
        self.assertEqual(str(physics),'GCSE Physics')
        self.assertEqual(str(english),'GCSE English Language')


class A_levelTestCase(TestCase):
    def setUp(self):
        A_level.objects.create(subject='Chemistry',grade='A')
        A_level.objects.create(subject='Mathematics',grade='A*')

    def test_strings(self):
        maths = A_level.objects.get(subject='Mathematics')
        chem  = A_level.objects.get(subject='Chemistry')
        self.assertEqual(str(maths),'A Level Mathematics')
        self.assertEqual(str(chem),'A Level Chemistry')


class DegreeTestCase(TestCase):
    def setUp(self):
        file = SimpleUploadedFile('thesis.txt',b'test thesis content')
        thesis = Thesis.objects.create(title='Test Title',file = file)
        Degree.objects.create(title='BA',subject='PPE',date_acquired='2010-01-01',
                            university='Oxford',grade='1st')
    def tearDown(self):
        thesis = Thesis.objects.get(title='Test Title')
        os.remove(f'{os.getcwd()}\\theses\\{thesis.uuid}\\thesis.txt')
        os.rmdir(f'{os.getcwd()}\\theses\\{thesis.uuid}')

    def test_strings(self):
        degree=Degree.objects.get(subject='PPE')
        self.assertEqual(str(degree),'BA PPE')


class ThesisTestCase(TestCase):
    def setUp(self):
        file = SimpleUploadedFile('thesis.txt',b'test thesis content')
        thesis = Thesis.objects.create(title='Test Title',file = file)

    def tearDown(self):
        thesis = Thesis.objects.get(title='Test Title')
        os.remove(f'{os.getcwd()}\\theses\\{thesis.uuid}\\thesis.txt')
        os.rmdir(f'{os.getcwd()}\\theses\\{thesis.uuid}')

    def test_thesis(self):
        thesis = Thesis.objects.get(title='Test Title')
        self.assertEqual(thesis.title,'Test Title')
