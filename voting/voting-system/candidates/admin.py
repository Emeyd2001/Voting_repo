from django.contrib import admin
from .models import Candidate


@admin.register(Candidate)
class CandidateAdmin(admin.ModelAdmin):
    list_display = ("name", "election", "party", "created_at")
    list_filter = ("election", "party")
    search_fields = ("name",)

