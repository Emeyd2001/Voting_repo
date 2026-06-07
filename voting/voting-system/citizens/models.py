from django.db import models
from django.utils.translation import gettext as _

class MauritaniaWilayaChoices(models.TextChoices):
    HODH_ECH_CHARGUI = "Hodh Ech Chargui", "Hodh Ech Chargui"
    HODH_EL_GHARBI = "Hodh El Gharbi", "Hodh El Gharbi"
    ASSABA = "Assaba", "Assaba"
    GORGOL = "Gorgol", "Gorgol"
    BRAKNA = "Brakna", "Brakna"
    TRARZA = "Trarza", "Trarza"
    ADRAR = "Adrar", "Adrar"
    DAKHLET_NOUADHIBOU = "Dakhlet Nouadhibou", "Dakhlet Nouadhibou"
    TAGANT = "Tagant", "Tagant"
    GUIDIMAGHA = "Guidimagha", "Guidimagha"
    TIRIS_ZEMMOUR = "Tiris Zemmour", "Tiris Zemmour"
    INCHIRI = "Inchiri", "Inchiri"
    NOUAKCHOTT_OUEST = "Nouakchott Ouest", "Nouakchott Ouest"
    NOUAKCHOTT_NORD = "Nouakchott Nord", "Nouakchott Nord"
    NOUAKCHOTT_SUD = "Nouakchott Sud", "Nouakchott Sud"


class CitizenRecord(models.Model):
    nni = models.CharField(max_length=10, unique=True)
    full_name = models.CharField(max_length=255)
    date_of_birth = models.DateField(null=True, blank=True)
    phone_number = models.CharField(max_length=20)
    wilaya = models.CharField(max_length=50, choices=MauritaniaWilayaChoices.choices)
    is_eligible = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["full_name"]
        verbose_name = "Citizen record"
        verbose_name_plural = "Citizen records"

    def __str__(self):
        return f"{self.full_name} ({self.nni})"
