from django.contrib import admin
from .models import Election, Party


@admin.register(Election)
class ElectionAdmin(admin.ModelAdmin):
    list_display = ("title", "start_date", "end_date", "created_at")

    search_fields = ("title", "description")
admin.site.register(Party)