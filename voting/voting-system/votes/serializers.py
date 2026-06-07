from rest_framework import serializers
from .models import Vote
from elections.models import Election
from candidates.models import Candidate
from django.utils.translation import gettext as _

# CREATE SERIALIZER

class VoteCreateSerializer(serializers.Serializer):
    election = serializers.PrimaryKeyRelatedField(queryset=Election.objects.all())
    candidate = serializers.PrimaryKeyRelatedField(queryset=Candidate.objects.all())

    def validate(self, attrs):
        election = attrs["election"]
        candidate = attrs["candidate"]
        return attrs

# ✅ FIX: VotePublicSerializer — 

class VotePublicSerializer(serializers.ModelSerializer):
    candidate_name = serializers.CharField(source="candidate.name", read_only=True)
    election_title = serializers.CharField(source="election.title", read_only=True)

    class Meta:
        model = Vote
        fields = [
            "id",
            "election",
            "election_title",
            "candidate",
            "candidate_name",
            "created_at",
            "status",
        ]
        read_only_fields = fields

# ADMIN SERIALIZER — للإدارة فقط

class VoteAdminSerializer(serializers.ModelSerializer):
    voter_email = serializers.EmailField(source="voter.email", read_only=True)
    candidate_name = serializers.CharField(source="candidate.name", read_only=True)
    election_title = serializers.CharField(source="election.title", read_only=True)

    class Meta:
        model = Vote
        fields = [
            "id",
            "election",
            "election_title",
            "voter",
            "voter_email",
            "candidate",
            "candidate_name",
            "created_at",
            "status",
        ]
        read_only_fields = fields