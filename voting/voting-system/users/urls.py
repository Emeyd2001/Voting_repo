from django.urls import path

from .views import (
    NNILoginView,
    UserProfileView,
    AdminUsersListView,
    AdminUserDetailView,
    AdminUserEligibilityView,
)

urlpatterns = [
    path("login/", NNILoginView.as_view(), name="nni-login"),
    path("profile/", UserProfileView.as_view(), name="user-profile"),
    
    # Admin User endpoints matching frontend expectations
    path("admin/users/", AdminUsersListView.as_view(), name="admin-users-list"),
    path("admin/users/<int:pk>/", AdminUserDetailView.as_view(), name="admin-users-detail"),
    path("admin/users/<int:pk>/eligibility/", AdminUserEligibilityView.as_view(), name="admin-users-eligibility"),
]
