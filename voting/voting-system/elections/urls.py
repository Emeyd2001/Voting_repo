from django.urls import path

from .views import (
    ElectionListCreateView,
    ElectionDetailView,
    AdminElectionActivateView,
    AdminElectionArchiveView,
    AdminElectionUnarchiveView,
    AdminElectionStatsView,
    ElectionResultsView,
    PartyListCreateView,
    PartyDetailView,
    ElectionRegisterView
)

urlpatterns = [
    # Elections (Admin & Public combined)
    path("", ElectionListCreateView.as_view(), name="election-list-create"),
    path("<int:pk>/", ElectionDetailView.as_view(), name="election-detail"),
    path("<int:pk>/activate/", AdminElectionActivateView.as_view(), name="election-activate"),
    path("<int:pk>/archive/", AdminElectionArchiveView.as_view(), name="election-archive"),
    path("<int:pk>/unarchive/", AdminElectionUnarchiveView.as_view(), name="election-unarchive"),
    path("stats/", AdminElectionStatsView.as_view(), name="election-stats"),
    path("<int:pk>/results/", ElectionResultsView.as_view(), name="election-results"),
    path("<int:pk>/register/", ElectionRegisterView.as_view(), name="election-register"),

    # Parties
    path("parties/", PartyListCreateView.as_view(), name="party-list-create"),
    path("parties/<int:pk>/", PartyDetailView.as_view(), name="party-detail"),
]
