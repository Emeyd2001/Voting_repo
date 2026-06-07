from django.db import transaction
from rest_framework.exceptions import ValidationError
from django.utils.translation import gettext as _
from .models import Vote
from elections.models import Election, Registration
from candidates.models import Candidate


class VoteService:

    # PRIVATE VALIDATIONS

    @staticmethod
    def _validate_voter_age(voter):
        if not hasattr(voter, "date_of_birth") or not voter.date_of_birth:
            raise ValidationError({
                "voter": _("يجب تسجيل تاريخ الميلاد قبل التصويت")
            })
        if not voter.is_eligible_voter():
            age = voter.get_age()
            raise ValidationError({
                "voter": _("يجب أن لا يقل عمر الناخب عن 18 سنة (عمرك الحالي: {age} سنة)").format(age=age)
            })

    @staticmethod
    def _validate_registration(voter, election):
        if not Registration.objects.filter(user=voter, election=election).exists():
            raise ValidationError({
                "voter": _("يجب التسجيل في هذه الانتخابات أولاً قبل التصويت")
            })

    # RECORD VOTE

    @staticmethod
    @transaction.atomic
    def record_vote(*, election_id, voter, candidate_id):
        election = Election.objects.select_for_update().get(id=election_id)

        if not election.is_available_for_voting():
            raise ValidationError({"election": _("التصويت غير متاح حالياً")})
            
        VoteService._validate_voter_age(voter)

        VoteService._validate_registration(voter, election)

        try:
            candidate = Candidate.objects.get(id=candidate_id)
        except Candidate.DoesNotExist:
            raise ValidationError({"candidate": _("المرشح غير موجود")})

        if candidate.election_id != election.id:
            raise ValidationError({"candidate": _("المرشح لا ينتمي لهذه الانتخابات")})

        if Vote.objects.filter(election=election, voter=voter).exists():
            raise ValidationError({"voter": _("لقد صوّت مسبقاً في هذه الانتخابات")})

        vote = Vote.objects.create(
            election=election,
            voter=voter,
            candidate=candidate,
        )
        return vote

    @staticmethod
    def delete_vote(*, vote):
        vote.delete()