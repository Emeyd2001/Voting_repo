from rest_framework import serializers
from django.utils import timezone
from django.utils.translation import gettext as _
from .models import Election, Party


# BASE VALIDATION

class BaseElectionSerializer(serializers.ModelSerializer):
    def validate(self, attrs):
        start_date = attrs.get("start_date", getattr(self.instance, "start_date", None))
        end_date   = attrs.get("end_date",   getattr(self.instance, "end_date",   None))
        reg_start  = attrs.get("registration_start", getattr(self.instance, "registration_start", None))
        reg_end    = attrs.get("registration_end",   getattr(self.instance, "registration_end",   None))

        if (self.instance is None or "start_date" in attrs) and start_date:
            if start_date < timezone.now():
                raise serializers.ValidationError({
                    "start_date": _("لا يمكن أن يكون تاريخ البداية في الماضي")
                })

        if start_date and end_date and start_date >= end_date:
            raise serializers.ValidationError({
                "end_date": _("يجب أن يكون تاريخ النهاية بعد تاريخ البداية")
            })

        if reg_start and reg_end and reg_start >= reg_end:
            raise serializers.ValidationError({
                "registration_end": _("يجب أن يكون تاريخ نهاية التسجيل بعد تاريخ بدايته")
            })

        if reg_end and end_date and reg_end > end_date:
            raise serializers.ValidationError({
                "registration_end": _("يجب أن ينتهي التسجيل قبل بداية الانتخابات")
            })
        return attrs



# ADMIN SERIALIZER

class ElectionAdminSerializer(BaseElectionSerializer):
    # ✅ status يُحسب تلقائياً — لا يُكتب ولا يُقرأ من DB
    status               = serializers.SerializerMethodField()
    registration_status  = serializers.CharField(read_only=True)
    can_be_modified      = serializers.SerializerMethodField()
    is_registration_open = serializers.SerializerMethodField()
    is_active_now        = serializers.SerializerMethodField()
    user_registered      = serializers.SerializerMethodField()

    class Meta:
        model = Election
        fields = [
            "id",
            "title",
            "description",
            "election_type",

            "start_date",
            "end_date",

            "registration_start",
            "registration_end",
            "registration_status",

            # ✅ الحقلان الجديدان بدل status النصي
            "is_published",
            "is_archived",

            # ✅ computed —
            "status",
            "can_be_modified",
            "is_registration_open",
            "is_active_now",
            "user_registered",

            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "status",
            "registration_status",
            "can_be_modified",
            "is_registration_open",
            "is_active_now",
            "user_registered",
            "is_published",
            "is_archived",
            "created_at",
            "updated_at",
        ]

    def get_status(self, obj):               return obj.computed_status()
    def get_can_be_modified(self, obj):      return obj.can_be_modified()
    def get_is_registration_open(self, obj): return obj.is_registration_open()
    def get_is_active_now(self, obj):        return obj.is_available_for_voting()

    def get_user_registered(self, obj):
        request = self.context.get("request")
        if request and request.user and request.user.is_authenticated:
            from .models import Registration
            return Registration.objects.filter(user=request.user, election=obj).exists()
        return False


# PUBLIC SERIALIZER

class ElectionPublicSerializer(serializers.ModelSerializer):
    status                  = serializers.SerializerMethodField()
    is_available_for_voting = serializers.SerializerMethodField()
    is_registration_open    = serializers.SerializerMethodField()
    user_registered         = serializers.SerializerMethodField()

    class Meta:
        model = Election
        fields = [
            "id",
            "title",
            "description",
            "election_type",

            "start_date",
            "end_date",

            "registration_start",
            "registration_end",

            "status",
            "is_available_for_voting",
            "is_registration_open",
            "user_registered",
        ]

    def get_status(self, obj):                  return obj.computed_status()
    def get_is_available_for_voting(self, obj): return obj.is_available_for_voting()
    def get_is_registration_open(self, obj):    return obj.is_registration_open()

    def get_user_registered(self, obj):
        request = self.context.get("request")
        if request and request.user and request.user.is_authenticated:
            from .models import Registration
            return Registration.objects.filter(user=request.user, election=obj).exists()
        return False


# PARTY SERIALIZERS

class PartyAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Party
        fields = [
            "id", "name", "description",
            "abbreviation", "date_founded", "logo",
            "created_at", "updated_at", "is_active",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class PartyPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Party
        fields = ["id", "name", "abbreviation", "logo"]