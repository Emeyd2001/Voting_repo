from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils.translation import gettext as _
from citizens.models import CitizenRecord, MauritaniaWilayaChoices


class UserRoleChoices(models.TextChoices):
    ADMIN = "admin", "Admin"
    VOTER = "voter", "Voter"


class UserManager(BaseUserManager):
    def create_user(self, nni, username, password=None, **extra_fields):
        if not nni:
            raise ValueError(_("The NNI field is required."))
        if not username:
            raise ValueError(_("The username field is required."))

        extra_fields.setdefault("role", UserRoleChoices.VOTER)
        user = self.model(
            nni=nni,
            username=username,
            **extra_fields,
        )
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, nni, username, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        extra_fields.setdefault("role", UserRoleChoices.ADMIN)

        if extra_fields.get("is_staff") is not True:
            raise ValueError(_("Superuser must have is_staff=True."))
        if extra_fields.get("is_superuser") is not True:
            raise ValueError(_("Superuser must have is_superuser=True."))
        if extra_fields.get("role") != UserRoleChoices.ADMIN:
            raise ValueError(_("Superuser must have role=admin."))

        if not password:
            raise ValueError(_("Superuser must have a password."))

        return self.create_user(nni, username, password=password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    citizen = models.OneToOneField(
        CitizenRecord,
        on_delete=models.PROTECT,
        related_name="user_account",
        null=True,
        blank=True,
    )
    nni = models.CharField(max_length=10, unique=True)
    username = models.CharField(max_length=255, unique=True)
    role = models.CharField(
        max_length=20,
        choices=UserRoleChoices.choices,
        default=UserRoleChoices.VOTER,
    )
    phone_number = models.CharField(max_length=20, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    wilaya = models.CharField(
        max_length=50,
        choices=MauritaniaWilayaChoices.choices,
        blank=True,
    )
    profile_image = models.ImageField(upload_to="profiles/", null=True, blank=True)
    is_eligible = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "nni"
    REQUIRED_FIELDS = ["username"]

    objects = UserManager()

    class Meta:
        ordering = ["username"]

    def __str__(self):
        return f"{self.username} ({self.nni})"

    def get_age(self):
        if not self.date_of_birth:
            return 0
        from datetime import date
        today = date.today()
        return today.year - self.date_of_birth.year - ((today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day))

    def is_eligible_voter(self):
        return self.get_age() >= 18

    def sync_from_citizen(self):
        if not self.citizen:
            return
        self.nni = self.citizen.nni
        self.phone_number = self.citizen.phone_number
        self.wilaya = self.citizen.wilaya
        if self.citizen.date_of_birth and not self.date_of_birth:
            self.date_of_birth = self.citizen.date_of_birth

    def save(self, *args, **kwargs):
        if self.is_superuser or self.is_staff:
            self.role = UserRoleChoices.ADMIN
        if self.citizen and self.date_of_birth != self.citizen.date_of_birth:
            self.citizen.date_of_birth = self.date_of_birth
            self.citizen.save(update_fields=["date_of_birth"])
        self.sync_from_citizen()
        super().save(*args, **kwargs)
