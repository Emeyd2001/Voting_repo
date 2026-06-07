from django.db import models
from django.utils import timezone
from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _

class ElectionType(models.TextChoices):
    PRESIDENTIAL  = "presidential",  _("رئاسية")
    PARLIAMENTARY = "parliamentary", _("برلمانية")
    LOCAL         = "local",         _("بلدية")
    OTHER         = "other",         _("أخرى")


#Status choices for Election model
class ElectionStatus:
    DRAFT     = "draft"
    SCHEDULED = "scheduled"
    ACTIVE    = "active"
    CLOSED    = "closed"
    ARCHIVED  = "archived"


class RegistrationStatus(models.TextChoices):
    CLOSED = "closed", _("مغلق")
    OPEN   = "open",   _("مفتوح")


#Party

class Party(models.Model):
    name         = models.CharField(max_length=255, unique=True)
    description  = models.TextField(blank=True)
    abbreviation = models.CharField(max_length=50, blank=True)
    date_founded = models.DateField(null=True, blank=True)
    logo         = models.ImageField(upload_to="parties/", null=True, blank=True)
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True, help_text="Parti actif (visible par les votants)")

    def __str__(self):
        return self.name

# ELECTION

class Election(models.Model):
    title       = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True)

    election_type = models.CharField(
        max_length=20,
        choices=ElectionType.choices,
        default=ElectionType.OTHER,
    )

    start_date = models.DateTimeField()
    end_date   = models.DateTimeField()

    registration_start = models.DateTimeField()
    registration_end   = models.DateTimeField()

    is_published = models.BooleanField(
        default=False,
        help_text=_("نُشرت الانتخابات وأصبحت مرئية للناخبين")
    )
    is_archived = models.BooleanField(
        default=False,
        help_text=_("أُرشفت الانتخابات يدوياً من قِبل الإدارة")
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # COMPUTED STATUS — 
    def computed_status(self):
        if self.is_archived:
            return ElectionStatus.ARCHIVED

        if not self.is_published:
            return ElectionStatus.DRAFT

        now = timezone.now()

        if now < self.start_date:
            return ElectionStatus.SCHEDULED

        if self.start_date <= now < self.end_date:
            return ElectionStatus.ACTIVE

        return ElectionStatus.CLOSED

    # HELPERS

    def is_available_for_voting(self):
        return self.computed_status() == ElectionStatus.ACTIVE

    def can_be_modified(self):
        return self.computed_status() in [
            ElectionStatus.DRAFT,
            ElectionStatus.SCHEDULED,
        ]

    def is_registration_open(self):
        now = timezone.now()
        return (
            self.registration_start is not None
            and self.registration_end is not None
            and self.registration_start <= now <= self.registration_end
        )

    @property
    def status(self):
    
        return self.computed_status()

    @property
    def registration_status(self):
        return RegistrationStatus.OPEN if self.is_registration_open() else RegistrationStatus.CLOSED

    # AGE RULES — Mauritanian electoral law
    @property
    def min_candidate_age(self) -> int:
        
        AGE_RULES = {
            ElectionType.PRESIDENTIAL:  40,
            ElectionType.PARLIAMENTARY: 25,
            ElectionType.LOCAL:         25,
        }
        return AGE_RULES.get(self.election_type, 18)

    def __str__(self):
        return self.title


# REGISTRATION

class Registration(models.Model):
    user       = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    election   = models.ForeignKey(Election, on_delete=models.CASCADE, related_name="registrations")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "election")

    def __str__(self):
        return f"{self.user} → {self.election}"