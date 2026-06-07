from django.db import transaction
from django.utils.text import slugify
from rest_framework.exceptions import ValidationError
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils.translation import gettext as _
from citizens.models import CitizenRecord

from .models import User, UserRoleChoices


class AuthenticationService:

    # Build a unique username for the user:
    @staticmethod
    def _build_username(citizen):
        base_username = slugify(citizen.full_name).replace("-", "_") or f"user_{citizen.nni[-4:]}"
        username = base_username
        suffix = 1

        while User.objects.filter(username=username).exclude(nni=citizen.nni).exists():
            suffix += 1
            username = f"{base_username}_{suffix}"

        return username

    # Login with NNI:
    @staticmethod
    @transaction.atomic
    def login_with_nni(nni):
        try:
            citizen = CitizenRecord.objects.get(nni=nni)
        except CitizenRecord.DoesNotExist as exc:
            raise ValidationError({"nni": _("No citizen was found with this NNI.")}) from exc

        if not citizen.is_eligible:
            raise ValidationError({"nni": _("This citizen is not allowed to access the platform.")})

        defaults = {
            "username": AuthenticationService._build_username(citizen),
            "role": UserRoleChoices.VOTER,
            "phone_number": citizen.phone_number,
            "wilaya": citizen.wilaya,
            "citizen": citizen,
        }
        user, created = User.objects.get_or_create(nni=nni, defaults=defaults)

        if created:
            user.set_unusable_password()
            user.save(update_fields=["password", "updated_at"])

        if created is False:
            if not user.is_active:
                raise ValidationError({"nni": _("This user account is disabled.")})
            user.citizen = citizen
            user.phone_number = citizen.phone_number
            user.wilaya = citizen.wilaya
            if not user.username:
                user.username = AuthenticationService._build_username(citizen)
            user.save(update_fields=["citizen", "nni", "phone_number", "wilaya", "username", "updated_at"])

        refresh = RefreshToken.for_user(user)
        return {
            "user": user,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }
