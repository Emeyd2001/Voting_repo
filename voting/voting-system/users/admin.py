from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    ordering = ("nni",)
    list_display = ("nni", "username", "role", "phone_number", "wilaya", "is_active", "is_staff")
    search_fields = ("nni", "username", "phone_number")
    readonly_fields = ("last_login", "date_joined", "updated_at")

    fieldsets = (
        (None, {"fields": ("nni", "username", "password")}),
        ("Citizen data", {"fields": ("citizen", "role", "phone_number", "wilaya", "profile_image")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Important dates", {"fields": ("last_login", "date_joined", "updated_at")}),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("nni", "username", "role", "password1", "password2", "is_active", "is_staff"),
            },
        ),
    )
