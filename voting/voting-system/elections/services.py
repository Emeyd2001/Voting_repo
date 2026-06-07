from rest_framework.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone
from django.utils.translation import gettext as _
from .models import Election, ElectionStatus, Party
from candidates.models import Candidate


class ElectionService:

    @staticmethod
    @transaction.atomic
    def create(**data):
        return Election.objects.create(**data)

    @staticmethod
    @transaction.atomic
    def update(election, **data):
        if not election.can_be_modified():
            raise ValidationError(_("لا يمكن تعديل الانتخابات بعد أن تبدأ"))

        for field, value in data.items():
            setattr(election, field, value)

        election.full_clean()
        election.save()
        return election

    @staticmethod
    @transaction.atomic
    def delete(election):
        if not election.can_be_modified():
            raise ValidationError(_("لا يمكن حذف الانتخابات بعد أن تبدأ"))
        election.delete()

    @staticmethod
    @transaction.atomic
    def activate(election):
        # ✅ is_published بدل status == DRAFT
        if election.is_published:
            raise ValidationError(_("الانتخابات منشورة مسبقاً"))

        if election.is_archived:
            raise ValidationError(_("لا يمكن تفعيل انتخابات مؤرشفة"))

        if not Candidate.objects.filter(election=election).exists():
            raise ValidationError(_("لا يوجد مرشحون في هذه الانتخابات"))

        if election.end_date <= timezone.now():
            raise ValidationError(_("انتهت مدة هذه الانتخابات"))

        # ✅ ضبط is_published فقط — computed_status() يتولى الباقي تلقائياً
        election.is_published = True
        election.save()
        return election

    @staticmethod
    @transaction.atomic
    def archive(election):
        if election.is_archived:
            raise ValidationError(_("الانتخابات مؤرشفة مسبقاً"))

        election.is_archived = True
        election.save()
        return election

    @staticmethod
    @transaction.atomic
    def unarchive(election):
        
        if not election.is_archived:
            raise ValidationError(_("الانتخابات ليست مؤرشفة"))

        election.is_archived = False
        election.save()
        return election


class PartyService:

    @staticmethod
    @transaction.atomic
    def create(**data):
        return Party.objects.create(**data)

    @staticmethod
    @transaction.atomic
    def update(party, **data):
        for field, value in data.items():
            setattr(party, field, value)
        party.full_clean()
        party.save()
        return party

    @staticmethod
    @transaction.atomic
    def delete(party):
        active = Candidate.objects.filter(
            party=party
        ).filter(
            election__is_published=True,
            election__is_archived=False,
            election__end_date__gt=timezone.now()
        ).exists()

        if active:
            raise ValidationError(_("لا يمكن حذف حزب مشارك في انتخابات نشطة أو مجدولة"))

        party.delete()