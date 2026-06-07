from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _
from elections.models import Election
from candidates.models import Candidate


class Vote(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', _('En attente')
        CONFIRMED = 'CONFIRMED', _('Confirmé')
        REJECTED = 'REJECTED', _('Rejeté')
    election = models.ForeignKey(
        Election,
        on_delete=models.CASCADE,
        related_name="votes"
    )

    voter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="votes"
    )

    candidate = models.ForeignKey(
        Candidate,
        on_delete=models.CASCADE,
        related_name="votes"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        help_text=_("Statut de validation du vote")
    )

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["election", "voter"],
                name="unique_vote_per_user_per_election"
            )
        ]
        indexes = [
        models.Index(fields=["election"]),
        models.Index(fields=["candidate"]),
        models.Index(fields=["voter"]),
        models.Index(fields=["status"]),
    ]

    def __str__(self):
        return f"{self.voter} → {self.candidate}"

    def clean(self):
        # ✅ المرشح يجب أن ينتمي لنفس الانتخابات
        if self.candidate and self.candidate.election_id != self.election_id:
            raise ValidationError({
                "candidate": _("هذا المرشح لا ينتمي لهذه الانتخابات")
            })