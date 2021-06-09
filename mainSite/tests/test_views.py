import os
from django.http import response

from django.test import TestCase, override_settings
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from django.conf import settings
from mainSite.models import GCSE, A_level, Degree, Thesis, FAQ_Question_Answer


class QualificationsViewTest(TestCase):
    def setUp(self):
        A_level.objects.create(subject='Chemistry', grade='A')
        A_level.objects.create(subject='Mathematics', grade='A*')
        GCSE.objects.create(subject='Physics', grade='A*')
        GCSE.objects.create(subject='English Language', grade='B')

        settings_manager = override_settings(SECURE_SSL_REDIRECT=False)
        settings_manager.enable()
        self.addCleanup(settings_manager.disable)

    def test_view_exists_at_correct_url(self):
        response = self.client.get('/qualifications/')
        self.assertEqual(response.status_code, 200)

    def test_view_accessible_by_name(self):
        response = self.client.get(reverse('qualifications'))
        self.assertEqual(response.status_code, 200)

    def test_view_uses_correct_template(self):
        response = self.client.get(reverse('qualifications'))
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'mainSite/qualifications.html')

    def test_all_qualifications_listed(self):
        response = self.client.get(reverse('qualifications'))
        self.assertEqual(response.status_code, 200)
        for subject in ['Physics', 'Chemistry',
                        'English Language', 'Mathematics']:
            self.assertContains(response, subject)

    def test_absent_qualifications_not_listed(self):
        response = self.client.get(reverse('qualifications'))
        self.assertEqual(response.status_code, 200)
        self.assertNotContains(response, 'Degree')


class FAQ_view_test(TestCase):
    def setUp(self):
        FAQ_Question_Answer.objects.create(Question='What on Earth?',
                                           Answer="It's cheese.")

        settings_manager = override_settings(SECURE_SSL_REDIRECT=False)
        settings_manager.enable()
        self.addCleanup(settings_manager.disable)

    def test_view_exists_at_correct_url(self):
        response = self.client.get('/FAQ/')
        self.assertEqual(response.status_code, 200)

    def test_view_accessible_by_name(self):
        response = self.client.get(reverse('FAQ'))
        self.assertEqual(response.status_code, 200)

    def test_view_uses_correct_template(self):
        response = self.client.get(reverse('FAQ'))
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'mainSite/FAQ.html')

    def test_question_listed(self):
        response = self.client.get(reverse('FAQ'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'What on Earth?')


class CV_view_test(TestCase):
    def setUp(self):
        settings_manager = override_settings(SECURE_SSL_REDIRECT=False)
        settings_manager.enable()
        self.addCleanup(settings_manager.disable)

    def test_view_exists_at_correct_url(self):
        response = self.client.get('/CV/')
        self.assertEqual(response.status_code, 200)

    def test_view_accessible_by_name(self):
        response = self.client.get(reverse('CV'))
        self.assertEqual(response.status_code, 200)


class thesis_view_test(TestCase):
    def setUp(self):
        settings_manager = override_settings(SECURE_SSL_REDIRECT=False)
        settings_manager.enable()
        self.addCleanup(settings_manager.disable)

    @classmethod
    def setUpTestData(cls):
        file = SimpleUploadedFile('thesis.txt', b'test thesis content')
        Thesis.objects.create(title='Test Title', file=file)

    @classmethod
    def tearDownClass(cls):
        thesis = Thesis.objects.get(title='Test Title')
        os.remove(f'{settings.MEDIA_ROOT}/theses/{thesis.uuid}/thesis.txt')
        os.rmdir(f'{settings.MEDIA_ROOT}/theses/{thesis.uuid}')
        super().tearDownClass()

    def test_view_exists_at_correct_url(self):
        thesis = Thesis.objects.get(title='Test Title')
        url = f'/theses/{thesis.uuid}'
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        response.close()

    def test_view_accessible_by_name(self):
        thesis = Thesis.objects.get(title='Test Title')
        response = self.client.get(reverse('thesis', args=[f'{thesis.uuid}']))
        self.assertEqual(response.status_code, 200)
        response.close()


class index_view_test(TestCase):
    def setUp(self):
        settings_manager = override_settings(SECURE_SSL_REDIRECT=False)
        settings_manager.enable()
        self.addCleanup(settings_manager.disable)

    def test_view_exists_at_correct_url(self):
        response = self.client.get('')
        self.assertEqual(response.status_code, 200)

    def test_view_accessible_by_name(self):
        response = self.client.get(reverse('index'))
        self.assertEqual(response.status_code, 200)


class contact_view_test(TestCase):
    def setUp(self):
        settings_manager = override_settings(SECURE_SSL_REDIRECT=False)
        settings_manager.enable()
        self.addCleanup(settings_manager.disable)

    def test_view_exists_at_correct_url(self):
        response = self.client.get('/contact/')
        self.assertEqual(response.status_code, 200)

    def test_view_accessible_by_name(self):
        response = self.client.get(reverse('contact'))
        self.assertEqual(response.status_code, 200)

class mandelbrot_view_test(TestCase):
    def setUp(self):
        settings_manager = override_settings(SECURE_SSL_REDIRECT=False)
        settings_manager.enable()
        self.addCleanup(settings_manager.disable)
    
    def test_view_exists_at_correct_url(self):
        response = self.client.get('/mandelbrot/')
        self.assertEqual(response.status_code, 200)

    def test_view_accessible_by_name(self):
        response = self.client.get(reverse('mandelbrot'))
        self.assertEqual(response.status_code, 200)

class mandelbrot_about_view_test(TestCase):
    def setUp(self):
        settings_manager = override_settings(SECURE_SSL_REDIRECT=False)
        settings_manager.enable()
        self.addCleanup(settings_manager.disable)
    
    def test_view_exists_at_correct_url(self):
        response = self.client.get('/mandelbrot/about')
        self.assertEqual(response.status_code, 200)

    def test_view_accessible_by_name(self):
        response = self.client.get(reverse('mandelbrot_about'))
        self.assertEqual(response.status_code, 200)
