from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase

from apps.associations.models import Association
from apps.users.models import User


class RegisterAssociationTests(APITestCase):
    def test_association_registration_generates_username_from_unicode_name(self):
        payload = {
            'account_type': 'association',
            'name': 'جمعية التعاون',
            'full_name': 'جمعية التعاون',
            'email': 'association1@example.com',
            'phone': '0600000000',
            'location': 'Casablanca',
            'bio': 'Association de test',
            'password': 'Secret123!',
            'document': SimpleUploadedFile('autorisation.pdf', b'%PDF-1.4 test', content_type='application/pdf'),
        }

        response = self.client.post('/api/auth/register/', payload, format='multipart')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        user = User.objects.get(email='association1@example.com')
        self.assertEqual(user.role, User.ROLE_ASSOCIATION)
        self.assertTrue(user.username.startswith('association'))
        self.assertTrue(Association.objects.filter(user=user, name='جمعية التعاون').exists())

    def test_association_registration_uses_unique_generated_username(self):
        User.objects.create_user(
            username='association_test',
            email='existing@example.com',
            password='Secret123!',
        )

        payload = {
            'account_type': 'association',
            'name': 'Association Test',
            'full_name': 'Association Test',
            'email': 'association2@example.com',
            'phone': '0611111111',
            'location': 'Rabat',
            'bio': 'Deuxieme association',
            'password': 'Secret123!',
            'document': SimpleUploadedFile('statut.pdf', b'%PDF-1.4 test', content_type='application/pdf'),
        }

        response = self.client.post('/api/auth/register/', payload, format='multipart')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        user = User.objects.get(email='association2@example.com')
        self.assertEqual(user.username, 'association_test_1')
