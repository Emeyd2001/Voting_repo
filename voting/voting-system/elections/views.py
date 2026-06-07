from django.shortcuts import get_object_or_404
from django.db.models import Count
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from django.utils.translation import gettext as _
from users.permissions import IsAdmin, IsVoter
from users.models import UserRoleChoices

from .models import Election, Registration, Party, ElectionStatus
from .serializers import (
    ElectionAdminSerializer,
    ElectionPublicSerializer,
    PartyAdminSerializer,
    PartyPublicSerializer,
)
from .services import ElectionService, PartyService
from votes.models import Vote
from candidates.models import Candidate
from citizens.models import CitizenRecord


class StandardPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100


# ELECTIONS

class ElectionListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role == UserRoleChoices.ADMIN:
            qs = Election.objects.all().order_by("-created_at")
            paginator = StandardPagination()
            page = paginator.paginate_queryset(qs, request)
            return paginator.get_paginated_response(ElectionAdminSerializer(page, many=True).data)
        else:
            qs = Election.objects.filter(is_published=True, is_archived=False).order_by("-created_at")
            paginator = StandardPagination()
            page = paginator.paginate_queryset(qs, request)
            return paginator.get_paginated_response(ElectionPublicSerializer(page, many=True).data)

    def post(self, request):
        if request.user.role != UserRoleChoices.ADMIN:
            return Response({"detail": _("Only admins can perform this action.")}, status=403)
        serializer = ElectionAdminSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        election = ElectionService.create(**serializer.validated_data)
        return Response(ElectionAdminSerializer(election).data, status=201)


class ElectionDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk): 
        return get_object_or_404(Election, pk=pk)

    def get(self, request, pk):
        election = self.get_object(pk)
        if request.user.role == UserRoleChoices.ADMIN:
            return Response(ElectionAdminSerializer(election).data)
        else:
            if not election.is_published or election.is_archived:
                return Response({"detail": _("غير متاح")}, status=403)
            return Response(ElectionPublicSerializer(election).data)

    def put(self, request, pk):
        if request.user.role != UserRoleChoices.ADMIN:
            return Response({"detail": _("Only admins can perform this action.")}, status=403)
        return self._update(request, pk, partial=False)

    def patch(self, request, pk):
        if request.user.role != UserRoleChoices.ADMIN:
            return Response({"detail": _("Only admins can perform this action.")}, status=403)
        return self._update(request, pk, partial=True)

    def _update(self, request, pk, partial):
        election = self.get_object(pk)
        serializer = ElectionAdminSerializer(election, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        updated = ElectionService.update(election, **serializer.validated_data)
        return Response(ElectionAdminSerializer(updated).data)

    def delete(self, request, pk):
        if request.user.role != UserRoleChoices.ADMIN:
            return Response({"detail": _("Only admins can perform this action.")}, status=403)
        ElectionService.delete(self.get_object(pk))
        return Response(status=204)


# ================= ACTIONS =================

class AdminElectionActivateView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        election = get_object_or_404(Election, pk=pk)
        election = ElectionService.activate(election)
        return Response(ElectionAdminSerializer(election).data)


class AdminElectionArchiveView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        election = get_object_or_404(Election, pk=pk)
        election = ElectionService.archive(election)
        return Response(ElectionAdminSerializer(election).data)


class AdminElectionUnarchiveView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        election = get_object_or_404(Election, pk=pk)
        election = ElectionService.unarchive(election)
        return Response(ElectionAdminSerializer(election).data)

class AdminElectionStatsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        total_elections = Election.objects.count()
        elections_counts = {
            "draft": 0,
            "scheduled": 0,
            "active": 0,
            "closed": 0,
            "archived": 0,
        }
        for e in Election.objects.all():
            status = e.computed_status()
            if status in elections_counts:
                elections_counts[status] += 1

        total_candidates = Candidate.objects.count()
        active_candidates = Candidate.objects.filter(is_active=True).count()

        total_parties = Party.objects.count()
        active_parties = Party.objects.filter(is_active=True).count()

        total_citizens = CitizenRecord.objects.count()
        eligible_citizens = CitizenRecord.objects.filter(is_eligible=True).count()

        total_votes = Vote.objects.count()

        return Response({
            "elections": {
                "total": total_elections,
                "draft": elections_counts["draft"],
                "scheduled": elections_counts["scheduled"],
                "active": elections_counts["active"],
                "closed": elections_counts["closed"],
                "archived": elections_counts["archived"],
            },
            "candidates": {
                "total": total_candidates,
                "active": active_candidates,
            },
            "parties": {
                "total": total_parties,
                "active": active_parties,
            },
            "citizens": {
                "total": total_citizens,
                "eligible": eligible_citizens,
            },
            "votes": {
                "total": total_votes,
            }
        })


class ElectionResultsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        election = get_object_or_404(Election, pk=pk)

        if election.computed_status() != ElectionStatus.CLOSED:
            return Response({"detail": _("النتائج غير متاحة بعد (الانتخابات لم تنته)")}, status=403)

        total_votes = Vote.objects.filter(election=election).count()

        candidates_votes = (
            Candidate.objects.filter(election=election)
            .annotate(vote_count=Count("votes"))
            .order_by("-vote_count")
        )

        results = []
        for c in candidates_votes:
            votes_count = c.vote_count
            percent = (votes_count / total_votes * 100) if total_votes else 0
            
            party_logo_url = None
            if c.party and c.party.logo:
                try:
                    party_logo_url = request.build_absolute_uri(c.party.logo.url)
                except Exception:
                    party_logo_url = c.party.logo.url

            results.append({
                "candidate_id":   c.id,
                "candidate_name": c.name,
                "party_acronym":  c.party.abbreviation if c.party else "",
                "party_logo":     party_logo_url,
                "count":          votes_count,
                "percentage":     round(percent, 2),
            })

        return Response({
            "election":    election.id,
            "title":       election.title,
            "total_votes": total_votes,
            "results":     results,
        })


# REGISTER

class ElectionRegisterView(APIView):
    permission_classes = [IsAuthenticated, IsVoter]

    def post(self, request, pk):
        election = get_object_or_404(Election, pk=pk)

        if not election.is_published or election.is_archived:
            return Response({"detail": _("هذه الانتخابات غير متاحة")}, status=403)

        if not election.is_registration_open():
            return Response({"detail": _("التسجيل مغلق حالياً")}, status=400)

        if Registration.objects.filter(user=request.user, election=election).exists():
            return Response({"detail": _("أنت مسجّل بالفعل في هذه الانتخابات")}, status=400)

        Registration.objects.create(user=request.user, election=election)
        return Response({"detail": _("تم التسجيل بنجاح")}, status=201)


# PARTIES

class PartyListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role == UserRoleChoices.ADMIN:
            qs = Party.objects.all().order_by("-created_at")
            paginator = StandardPagination()
            page = paginator.paginate_queryset(qs, request)
            return paginator.get_paginated_response(PartyAdminSerializer(page, many=True).data)
        else:
            qs = Party.objects.all().order_by("name")
            paginator = StandardPagination()
            page = paginator.paginate_queryset(qs, request)
            return paginator.get_paginated_response(PartyPublicSerializer(page, many=True).data)

    def post(self, request):
        if request.user.role != UserRoleChoices.ADMIN:
            return Response({"detail": _("Only admins can perform this action.")}, status=403)
        serializer = PartyAdminSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        party = PartyService.create(**serializer.validated_data)
        return Response(PartyAdminSerializer(party).data, status=201)


class PartyDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk): return get_object_or_404(Party, pk=pk)

    def get(self, request, pk):
        if request.user.role == UserRoleChoices.ADMIN:
            return Response(PartyAdminSerializer(self.get_object(pk)).data)
        else:
            return Response(PartyPublicSerializer(self.get_object(pk)).data)

    def put(self, request, pk):
        if request.user.role != UserRoleChoices.ADMIN:
            return Response({"detail": _("Only admins can perform this action.")}, status=403)
        return self._update(request, pk, False)

    def patch(self, request, pk):
        if request.user.role != UserRoleChoices.ADMIN:
            return Response({"detail": _("Only admins can perform this action.")}, status=403)
        return self._update(request, pk, True)

    def _update(self, request, pk, partial):
        party = self.get_object(pk)
        serializer = PartyAdminSerializer(party, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        updated = PartyService.update(party, **serializer.validated_data)
        return Response(PartyAdminSerializer(updated).data)

    def delete(self, request, pk):
        if request.user.role != UserRoleChoices.ADMIN:
            return Response({"detail": _("Only admins can perform this action.")}, status=403)
        PartyService.delete(self.get_object(pk))
        return Response(status=204)