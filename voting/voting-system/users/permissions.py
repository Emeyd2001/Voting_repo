from rest_framework.permissions import BasePermission
from django.utils.translation import gettext as _
from .models import UserRoleChoices


class IsAdmin(BasePermission):
    message = _("Only admins can perform this action.")

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == UserRoleChoices.ADMIN
        )


class IsVoter(BasePermission):
    message = _("Only voters can perform this action.")

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == UserRoleChoices.VOTER
        )