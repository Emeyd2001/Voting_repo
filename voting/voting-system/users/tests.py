from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from citizens.models import CitizenRecord, MauritaniaWilayaChoices
from .models import User, UserRoleChoices


class NNILoginViewTests(APITestCase):
    def setUp(self):
        self.login_url = reverse("nni-login")
        self.citizen = CitizenRecord.objects.create(
            nni="1234567890",
            full_name="Mohamed Salem",
            phone_number="22234567890",
            wilaya=MauritaniaWilayaChoices.NOUAKCHOTT_OUEST,
        )

    def test_login_with_existing_citizen_returns_tokens_and_user_data(self):
        response = self.client.post(self.login_url, {"nni": self.citizen.nni}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertEqual(response.data["user"]["nni"], self.citizen.nni)
        self.assertEqual(response.data["user"]["full_name"], self.citizen.full_name)
        self.assertEqual(response.data["user"]["role"], UserRoleChoices.VOTER)
        self.assertTrue(User.objects.filter(nni=self.citizen.nni).exists())
        self.assertFalse(User.objects.get(nni=self.citizen.nni).has_usable_password())

    def test_login_with_unknown_nni_returns_validation_error(self):
        response = self.client.post(self.login_url, {"nni": "9999999999"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("nni", response.data)

    def test_create_superuser_sets_admin_role(self):
        admin_user = User.objects.create_superuser(
            nni="2000000001",
            username="system_admin",
            password="StrongAdminPass123",
        )

        self.assertEqual(admin_user.role, UserRoleChoices.ADMIN)
        self.assertTrue(admin_user.is_staff)
        self.assertTrue(admin_user.is_superuser)


class UserAdminTests(TestCase):
    def setUp(self):
        self.admin_user = User.objects.create_superuser(
            nni="2000000002",
            username="admin_for_django_admin",
            password="StrongAdminPass123",
        )
        self.regular_user = User.objects.create_user(
            nni="2000000003",
            username="regular_user",
        )
        self.client.force_login(self.admin_user)

    def test_user_change_page_loads_successfully_in_admin(self):
        url = reverse("admin:users_user_change", args=[self.regular_user.pk])

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
