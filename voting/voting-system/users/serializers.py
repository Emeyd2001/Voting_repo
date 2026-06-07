from rest_framework import serializers
from django.utils.translation import gettext as _
from .models import User


class NNILoginSerializer(serializers.Serializer):
    nni = serializers.CharField(max_length=10, min_length=10)

    def validate_nni(self, value):
        value = value.strip()
        if not value.isdigit():
            raise serializers.ValidationError(_("NNI must contain only digits."))
        return value


class UserProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source="citizen.full_name", read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "nni",
            "username",
            "role",
            "full_name",
            "phone_number",
            "date_of_birth",
            "wilaya",
            "profile_image",
        ]


class UserAdminSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    is_eligible = serializers.SerializerMethodField()
    created_at = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "nni",
            "username",
            "role",
            "full_name",
            "phone_number",
            "date_of_birth",
            "wilaya",
            "profile_image",
            "is_active",
            "is_eligible",
            "created_at",
        ]

    def get_full_name(self, obj):
        return obj.citizen.full_name if obj.citizen else ""

    def get_is_eligible(self, obj):
        return obj.citizen.is_eligible if obj.citizen else False

    def get_created_at(self, obj):
        return obj.date_joined.isoformat() if obj.date_joined else None