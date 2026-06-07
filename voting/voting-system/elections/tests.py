from datetime import timedelta

from django.core.exceptions import ValidationError
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Election, ElectionStatusChoices
from users.models import User


class ElectionAPITests(APITestCase):
    def setUp(self):
        self.admin_user = User.objects.create_superuser(
            nni="3000000001",
            username="election_admin",
            password="StrongAdminPass123",
        )
        self.voter_user = User.objects.create_user(
            nni="3000000002",
            username="election_voter",
        )
        self.admin_list_url = reverse("admin-election-list-create")
        self.public_list_url = reverse("public-election-list")

    def _create_election(
        self,
        *,
        title="Presidential Election 2029",
        status=ElectionStatusChoices.DRAFT,
        start_offset_days=5,
        end_offset_days=7,
    ):
        now = timezone.now()
        return Election.objects.create(
            title=title,
            description="National election",
            start_date=now + timedelta(days=start_offset_days),
            end_date=now + timedelta(days=end_offset_days),
            status=status,
        )

    def test_admin_can_create_election(self):
        self.client.force_authenticate(user=self.admin_user)

        payload = {
            "title": "Presidential Election 2030",
            "description": "National vote",
            "start_date": (timezone.now() + timedelta(days=10)).isoformat(),
            "end_date": (timezone.now() + timedelta(days=12)).isoformat(),
        }
        response = self.client.post(self.admin_list_url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["status"], ElectionStatusChoices.DRAFT)
        self.assertTrue(Election.objects.filter(title=payload["title"]).exists())

    def test_voter_cannot_access_admin_election_creation(self):
        self.client.force_authenticate(user=self.voter_user)

        payload = {
            "title": "Forbidden Election",
            "description": "Should fail",
            "start_date": (timezone.now() + timedelta(days=2)).isoformat(),
            "end_date": (timezone.now() + timedelta(days=3)).isoformat(),
        }
        response = self.client.post(self.admin_list_url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_cannot_create_election_with_start_date_in_the_past(self):
        self.client.force_authenticate(user=self.admin_user)

        payload = {
            "title": "Past Election",
            "description": "Should fail because start date is in the past",
            "start_date": (timezone.now() - timedelta(days=1)).isoformat(),
            "end_date": (timezone.now() + timedelta(days=1)).isoformat(),
        }
        response = self.client.post(self.admin_list_url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("start_date", response.data)

    def test_cannot_update_election_after_start(self):
        self.client.force_authenticate(user=self.admin_user)
        election = self._create_election(
            title="Started Election",
            start_offset_days=-1,
            end_offset_days=1,
        )
        detail_url = reverse("admin-election-detail", kwargs={"pk": election.pk})

        response = self.client.patch(
            detail_url,
            {"description": "Updated after start"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("status", response.data)

    def test_public_listing_only_returns_visible_elections(self):
        self.client.force_authenticate(user=self.voter_user)
        draft_election = self._create_election(title="Draft Election", status=ElectionStatusChoices.DRAFT)
        scheduled_election = self._create_election(
            title="Scheduled Election",
            status=ElectionStatusChoices.SCHEDULED,
        )
        active_election = self._create_election(
            title="Active Election",
            status=ElectionStatusChoices.ACTIVE,
            start_offset_days=-1,
            end_offset_days=1,
        )
        closed_election = self._create_election(
            title="Closed Election",
            status=ElectionStatusChoices.CLOSED,
            start_offset_days=-10,
            end_offset_days=-5,
        )
        archived_election = self._create_election(
            title="Archived Election",
            status=ElectionStatusChoices.ARCHIVED,
            start_offset_days=-20,
            end_offset_days=-15,
        )

        response = self.client.get(self.public_list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        titles = {item["title"] for item in response.data}
        self.assertNotIn(draft_election.title, titles)
        self.assertNotIn(archived_election.title, titles)
        self.assertIn(scheduled_election.title, titles)
        self.assertIn(active_election.title, titles)
        self.assertIn(closed_election.title, titles)

    def test_invalid_status_transition_is_rejected(self):
        self.client.force_authenticate(user=self.admin_user)
        election = self._create_election(title="Draft To Archive", status=ElectionStatusChoices.DRAFT)
        archive_url = reverse("admin-election-archive", kwargs={"pk": election.pk})

        response = self.client.post(archive_url, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("status", response.data)

    def test_model_full_clean_with_missing_dates_returns_validation_error_not_type_error(self):
        election = Election(title="Incomplete Election")

        with self.assertRaises(ValidationError):
            election.full_clean()
