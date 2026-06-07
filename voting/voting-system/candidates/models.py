from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _
from elections.models import Election, Party


class GenderChoices(models.TextChoices):
    MALE = "male", _("ذكر")
    FEMALE = "female", _("أنثى")


class Candidate(models.Model):

    election = models.ForeignKey(
        Election,
        on_delete=models.CASCADE,
        related_name="candidates"
    )

    # ✅ الحزب مستقل — لا تحقق من election_id هنا
    party = models.ForeignKey(
        Party,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="candidates"
    )

    name          = models.CharField(max_length=255)
    bio           = models.TextField(blank=True)
    date_of_birth = models.DateField(
        null=True,
        blank=False,
        help_text=_("تاريخ ميلاد المترشح — مطلوب للتحقق من السن")
    )
    nationality = models.CharField(
        max_length=100,
        default="Mauritanian",
        help_text=_("جنسية المترشح — يجب أن تكون موريتانية")
    )
    gender = models.CharField(
        max_length=10,
        choices=GenderChoices.choices,
        default=GenderChoices.MALE,
        help_text=_("جنس المترشح")
    )

    profile_image = models.ImageField(
        upload_to="candidates/",
        null=True,
        blank=True
    )
    order = models.IntegerField(
        default=0,
        help_text=_("Ordre d'affichage (plus petit = plus haut)")
    )
    is_active = models.BooleanField(
        default=True,
        help_text=_("Si False, le candidat est désactivé (ne peut pas recevoir de votes)")
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering      = ["-created_at", "name"]
        unique_together = ("election", "name")

    def __str__(self):
        return f"{self.name} ({self.election.title})"

    # HELPER
    def get_age(self):
        if not self.date_of_birth:
            return None
        today = timezone.now().date()
        dob   = self.date_of_birth
        return today.year - dob.year - (
            (today.month, today.day) < (dob.month, dob.day)
        )

    # VALIDATION
    
    def clean(self):
        # ❌ Prevent adding candidates after the election has started
        if self.election and not self.election.can_be_modified():
            raise ValidationError({
                "election": _("لا يمكن إضافة مرشحين بعد بدء الانتخابات")
            })

        # ✅ Mauritanian Nationality Verification
        if self.nationality:
            nat_lower = self.nationality.strip().lower()
            if nat_lower not in ["mauritanian", "موريتانية", "mauritanienne"]:
                raise ValidationError({
                    "nationality": _("يجب أن تكون الجنسية موريتانية للمترشح")
                })

        # ✅ Enforce minimum age based on election type (Mauritanian electoral law)
        if self.date_of_birth and self.election:
            age = self.get_age()

            if age is None:
                raise ValidationError({
                    "date_of_birth": _("تاريخ الميلاد غير صحيح")
                })

            min_age = self.election.min_candidate_age
            if age < min_age:
                raise ValidationError({
                    "date_of_birth": _(
                        f"عمر المترشح ({age} سنة) أقل من الحد الأدنى "
                        f"المطلوب لهذه الانتخابات ({min_age} سنة)"
                    )
                })

    # SAVE
   
    def save(self, *args, **kwargs):
        
        self.full_clean()
        super().save(*args, **kwargs)