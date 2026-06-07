from django.shortcuts import get_object_or_404
from django.db.models import Count
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from django.utils.translation import gettext as _
from users.permissions import IsVoter, IsAdmin
from users.models import UserRoleChoices

from .serializers import VoteCreateSerializer, VotePublicSerializer, VoteAdminSerializer
from .services import VoteService
from .models import Vote
from elections.models import Election, ElectionStatus


class StandardPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100


class VoteCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != UserRoleChoices.ADMIN:
            return Response({"detail": _("Only admins can perform this action.")}, status=403)

        qs = (
            Vote.objects
            .select_related("election", "voter", "candidate")
            .order_by("-created_at")
        )

        election_id = request.query_params.get("election")
        if election_id:
            qs = qs.filter(election_id=election_id)

        candidate_id = request.query_params.get("candidate")
        if candidate_id:
            qs = qs.filter(candidate_id=candidate_id)

        paginator = StandardPagination()
        page = paginator.paginate_queryset(qs, request)

        return paginator.get_paginated_response(
            VoteAdminSerializer(page, many=True).data
        )

    def post(self, request):
        if request.user.role != UserRoleChoices.VOTER:
            return Response({"detail": _("Only voters can perform this action.")}, status=403)

        serializer = VoteCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        vote = VoteService.record_vote(
            election_id=serializer.validated_data["election"].id,
            voter=request.user,
            candidate_id=serializer.validated_data["candidate"].id,
        )

        return Response(VotePublicSerializer(vote).data, status=status.HTTP_201_CREATED)


class VoteDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        if request.user.role != UserRoleChoices.ADMIN:
            return Response({"detail": _("Only admins can perform this action.")}, status=403)

        vote = get_object_or_404(
            Vote.objects.select_related("election", "voter", "candidate"),
            pk=pk
        )
        return Response(VoteAdminSerializer(vote).data)

    def delete(self, request, pk):
        if request.user.role != UserRoleChoices.ADMIN:
            return Response({"detail": _("Only admins can perform this action.")}, status=403)

        vote = get_object_or_404(Vote, pk=pk)
        VoteService.delete_vote(vote=vote)
        return Response(status=status.HTTP_204_NO_CONTENT)


class VoteResultsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        election_id = request.query_params.get("election")
        if not election_id:
            return Response({"detail": _("يجب تحديد رقم الانتخابات (election query parameter)")}, status=400)

        election = get_object_or_404(Election, pk=election_id)

        # Only admins can see results before the election is closed.
        if election.computed_status() != ElectionStatus.CLOSED and request.user.role != UserRoleChoices.ADMIN:
            return Response({"detail": _("النتائج غير متاحة بعد (الانتخابات لم تنته)")}, status=403)

        total_votes = Vote.objects.filter(election=election).count()

        party_counts = (
            Vote.objects.filter(election=election)
            .values("candidate__party", "candidate__party__name")
            .annotate(count=Count("id"))
            .order_by("-count")
        )

        results = []
        for item in party_counts:
            count   = item["count"]
            percent = (count / total_votes * 100) if total_votes else 0
            results.append({
                "party_id": item["candidate__party"],
                "name":     item["candidate__party__name"],
                "votes":    count,
                "percent":  round(percent, 2),
            })

        return Response({
            "election":    election.id,
            "title":       election.title,
            "total_votes": total_votes,
            "results":     results,
        })

class MeVoteView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != UserRoleChoices.VOTER:
            return Response({"detail": _("Only voters can perform this action.")}, status=403)

        qs = Vote.objects.filter(voter=request.user).select_related("election", "candidate")
        
        paginator = StandardPagination()
        page = paginator.paginate_queryset(qs, request)

        return paginator.get_paginated_response(
            VotePublicSerializer(page, many=True).data
        )