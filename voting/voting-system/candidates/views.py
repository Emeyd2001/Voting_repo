from django.shortcuts import get_object_or_404
from django.db.models import Count, Sum
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from django.utils.translation import gettext as _
from users.permissions import IsAdmin, IsVoter
from users.models import UserRoleChoices

from .models import Candidate
from .serializers import CandidateAdminSerializer, CandidatePublicSerializer
from .services import CandidateService


class StandardPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 50


class CandidateListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        election_id = request.query_params.get("election")

        if request.user.role == UserRoleChoices.ADMIN:
            qs = Candidate.objects.select_related("election", "party").all()
            if election_id:
                qs = qs.filter(election_id=election_id)
            
            paginator = StandardPagination()
            page = paginator.paginate_queryset(qs, request)
            return paginator.get_paginated_response(CandidateAdminSerializer(page, many=True).data)
        else:
            qs = Candidate.objects.select_related("party")
            if election_id:
                qs = qs.filter(election_id=election_id)

            qs = qs.annotate(total_votes=Count("votes")).order_by("-total_votes")
            total_votes = qs.aggregate(total=Sum("total_votes"))["total"] or 0

            paginator = StandardPagination()
            page = paginator.paginate_queryset(qs, request)

            serializer = CandidatePublicSerializer(page, many=True)
            data = serializer.data

            for i, c in enumerate(page):
                percentage = (c.total_votes / total_votes * 100) if total_votes > 0 else 0
                data[i]["percentage"] = round(percentage, 2)

            return paginator.get_paginated_response(data)

    def post(self, request):
        if request.user.role != UserRoleChoices.ADMIN:
            return Response({"detail": _("Only admins can perform this action.")}, status=403)
        
        serializer = CandidateAdminSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        candidate = CandidateService.create_candidate(
            election_id=serializer.validated_data["election"].id,
            name=serializer.validated_data["name"],
            date_of_birth=serializer.validated_data["date_of_birth"],
            party=serializer.validated_data.get("party"),
            bio=serializer.validated_data.get("bio", ""),
            profile_image=serializer.validated_data.get("profile_image"),
            order=serializer.validated_data.get("order", 0),
            is_active=serializer.validated_data.get("is_active", True)
        )

        return Response(CandidateAdminSerializer(candidate).data, status=status.HTTP_201_CREATED)


class CandidateDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        if request.user.role == UserRoleChoices.ADMIN:
            candidate = get_object_or_404(Candidate, pk=pk)
            return Response(CandidateAdminSerializer(candidate).data)
        else:
            candidate = get_object_or_404(
                Candidate.objects.select_related("election", "party").annotate(
                    total_votes=Count("votes")
                ),
                pk=pk
            )

            total_votes = (
                Candidate.objects
                .filter(election=candidate.election)
                .annotate(v=Count("votes"))
                .aggregate(total=Sum("v"))["total"]
            ) or 0

            percentage = (candidate.votes / total_votes * 100) if total_votes > 0 else 0

            data = CandidatePublicSerializer(candidate).data
            data["percentage"] = round(percentage, 2)

            return Response(data)

    def put(self, request, pk):
        if request.user.role != UserRoleChoices.ADMIN:
            return Response({"detail": _("Only admins can perform this action.")}, status=403)
        return self._update(request, pk, partial=False)

    def patch(self, request, pk):
        if request.user.role != UserRoleChoices.ADMIN:
            return Response({"detail": _("Only admins can perform this action.")}, status=403)
        return self._update(request, pk, partial=True)

    def _update(self, request, pk, partial):
        candidate = get_object_or_404(Candidate, pk=pk)
        serializer = CandidateAdminSerializer(candidate, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        updated = CandidateService.update_candidate(candidate=candidate, **serializer.validated_data)
        return Response(CandidateAdminSerializer(updated).data)

    def delete(self, request, pk):
        if request.user.role != UserRoleChoices.ADMIN:
            return Response({"detail": _("Only admins can perform this action.")}, status=403)
        candidate = get_object_or_404(Candidate, pk=pk)
        CandidateService.delete_candidate(candidate=candidate)
        return Response(status=status.HTTP_204_NO_CONTENT)