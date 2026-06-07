from rest_framework import serializers
from .models import Candidate
from django.utils.translation import gettext as _


class CandidateAdminSerializer(serializers.ModelSerializer):
    election_title = serializers.CharField(source="election.title", read_only=True)
    party_name     = serializers.CharField(source="party.name", read_only=True)
    party_logo     = serializers.ImageField(source="party.logo", read_only=True)
    party_acronym  = serializers.CharField(source="party.abbreviation", read_only=True)
    age            = serializers.SerializerMethodField()
    full_name      = serializers.CharField(source="name", read_only=True)
    image          = serializers.ImageField(source="profile_image", read_only=True)

    class Meta:
        model = Candidate
        fields = [
            "id",
            "election",
            "election_title",
            "party",
            "party_name",
            "party_logo",
            "party_acronym",
            "name",
            "full_name",
            "date_of_birth",
            "nationality",
            "gender",
            "age",
            "bio",
            "profile_image",
            "image",
            "order",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id", "created_at", "updated_at",
            "election_title", "party_name", "party_logo", "party_acronym", "age",
        ]

    def to_internal_value(self, data):
        # Fallback/support full_name and image sent from frontend
        if "full_name" in data or "image" in data:
            data = data.copy()
            if "full_name" in data and "name" not in data:
                data["name"] = data["full_name"]
            if "image" in data and "profile_image" not in data:
                data["profile_image"] = data["image"]
        return super().to_internal_value(data)

    def get_age(self, obj):
        return obj.get_age()

    def validate(self, attrs):
        election = attrs.get("election", getattr(self.instance, "election", None))

        # ✅ منع الإضافة بعد بداية الانتخابات
        if election and not election.can_be_modified():
            raise serializers.ValidationError({
                "election": _("لا يمكن إضافة أو تعديل مرشح بعد بدء الانتخابات")
            })

        # ✅ التحقق من السن
        dob = attrs.get("date_of_birth", getattr(self.instance, "date_of_birth", None))
        if dob and election:
            from django.utils import timezone
            today   = timezone.now().date()
            age     = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
            min_age = election.min_candidate_age

            if age < min_age:
                raise serializers.ValidationError({
                    "date_of_birth": _(
                        f"عمر المترشح ({age} سنة) أقل من الحد الأدنى "
                        f"المطلوب لهذه الانتخابات ({min_age} سنة)"
                    )
                })

        # ✅ التحقق من الجنسية الموريتانية
        nationality = attrs.get("nationality", getattr(self.instance, "nationality", None))
        if nationality:
            nat_lower = nationality.strip().lower()
            if nat_lower not in ["mauritanian", "موريتانية", "mauritanienne"]:
                raise serializers.ValidationError({
                    "nationality": _("يجب أن تكون الجنسية موريتانية للمترشح")
                })

        return attrs


class CandidatePublicSerializer(serializers.ModelSerializer):
    party_name = serializers.CharField(source="party.name", default=None)
    party_logo = serializers.ImageField(source="party.logo", read_only=True)
    party_acronym = serializers.CharField(source="party.abbreviation", read_only=True)
    votes_count = serializers.IntegerField(read_only=True)
    percentage = serializers.FloatField(read_only=True)
    full_name = serializers.CharField(source="name", read_only=True)
    image = serializers.ImageField(source="profile_image", read_only=True)

    class Meta:
        model = Candidate
        fields = [
            "id", "name", "full_name", "nationality", "gender", "bio", "profile_image", "image",
            "party", "party_name", "party_logo", "party_acronym", "order", "is_active",
            "votes_count", "percentage",
        ]