from django.contrib import admin
from .models import CitizenRecord


@admin.register(CitizenRecord)
class CitizenRecordAdmin(admin.ModelAdmin):
    list_display = ("full_name", "nni", "phone_number", "wilaya", "is_eligible")
    list_filter = ("wilaya", "is_eligible")
    search_fields = ("full_name", "nni", "phone_number")
