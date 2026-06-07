from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from django.utils.translation import gettext as _
from .models import Candidate
from elections.models import Election


class CandidateService:

    # PRIVATE VALIDATIONS
    

    @staticmethod
    def _validate_unique_name(election_id, name, candidate_id=None):
        qs = Candidate.objects.filter(election_id=election_id, name__iexact=name)
        if candidate_id:
            qs = qs.exclude(id=candidate_id)
        if qs.exists():
            raise ValidationError({"name": _("يوجد مرشح بنفس الاسم في هذه الانتخابات")})

    @staticmethod
    def _validate_election_modifiable(election):
        if not election.can_be_modified():
            raise ValidationError({"election": _("لا يمكن تعديل المرشحين بعد بدء الانتخابات")})

    @staticmethod
    def _validate_candidate_age(date_of_birth, election):
        
        if not date_of_birth:
            raise ValidationError({"date_of_birth": _("تاريخ الميلاد مطلوب")})

        today   = timezone.now().date()
        age     = today.year - date_of_birth.year - (
            (today.month, today.day) < (date_of_birth.month, date_of_birth.day)
        )
        min_age = election.min_candidate_age

        if age < min_age:
            raise ValidationError({
                "date_of_birth": _(
                    f"عمر المترشح ({age} سنة) أقل من الحد الأدنى "
                    f"المطلوب لهذه الانتخابات ({min_age} سنة)"
                )
            })

    # CREATE

    @staticmethod
    @transaction.atomic
    def create_candidate(*, election_id, name, date_of_birth, party=None, bio="", profile_image=None, order=0, is_active=True):
        election = Election.objects.get(id=election_id)

        CandidateService._validate_election_modifiable(election)
        CandidateService._validate_unique_name(election_id, name)
        CandidateService._validate_candidate_age(date_of_birth, election)

        candidate = Candidate(
            election_id=election_id,
            name=name,
            date_of_birth=date_of_birth,
            party=party,
            bio=bio,
            order=order,
            is_active=is_active

        )
        if profile_image:
            candidate.profile_image = profile_image

        candidate.full_clean()
        candidate.save()
        return candidate

    # UPDATE

    @staticmethod
    @transaction.atomic
    def update_candidate(*, candidate, **data):
        CandidateService._validate_election_modifiable(candidate.election)

        new_name = data.get("name", candidate.name)
        CandidateService._validate_unique_name(
            candidate.election_id, new_name, candidate_id=candidate.id
        )

        dob = data.get("date_of_birth", candidate.date_of_birth)
        CandidateService._validate_candidate_age(dob, candidate.election)

        for field, value in data.items():
            setattr(candidate, field, value)

        candidate.full_clean()
        candidate.save()
        return candidate

    # DELETE

    @staticmethod
    @transaction.atomic
    def delete_candidate(*, candidate):
        CandidateService._validate_election_modifiable(candidate.election)
        candidate.delete()