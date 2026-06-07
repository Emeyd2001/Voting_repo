from django.urls import path

from .views import VoteCreateView, VoteDetailView, VoteResultsView, MeVoteView

urlpatterns = [
    path("cast/", VoteCreateView.as_view(), name="vote-create-list"),
    path("<int:pk>/", VoteDetailView.as_view(), name="vote-detail"),
    path("results/", VoteResultsView.as_view(), name="vote-results"),
    path("me/", MeVoteView.as_view(), name="my-vote"),
    path("me/results/", MeVoteView.as_view(), name="my-vote-results")
]
