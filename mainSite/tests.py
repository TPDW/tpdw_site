from django.test import TestCase
from .models import GCSE, A_level, Degree
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
