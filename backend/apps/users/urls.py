from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    RegisterView, ProfileView, MeView, MeProfileView,
    SearchView, UserPublicProfileView,
    UpdateProfileView, ChangePasswordView, TogglePrivacyView,
    # 👑 Admin
    AdminStatsView, AdminUsersView, AdminToggleUserView,
    AdminAssociationsView, RejectAssociationView,
    AdminCampaignsView, AdminToggleCampaignView,
    AdminDonationsView,
)

urlpatterns = [
    # Auth
    path('auth/register/',        RegisterView.as_view(),          name='register'),
    path('auth/login/',           TokenObtainPairView.as_view(),   name='login'),
    path('auth/refresh/',         TokenRefreshView.as_view(),      name='token_refresh'),
    path('auth/me/',              MeView.as_view(),                name='me'),
    path('auth/me/profile/',      MeProfileView.as_view(),         name='me-profile'),
    path('auth/profile/update/',  UpdateProfileView.as_view()),
    path('auth/change-password/', ChangePasswordView.as_view()),
    path('auth/privacy/',         TogglePrivacyView.as_view()),

    # Users
    path('users/<uuid:id>/',      UserPublicProfileView.as_view(), name='user-public-profile'),
    path('search/',               SearchView.as_view(),            name='search'),

    # 👑 Admin
    path('admin/stats/',                             AdminStatsView.as_view(),            name='admin-stats'),
    path('admin/users/',                             AdminUsersView.as_view(),             name='admin-users'),
    path('admin/users/<int:pk>/toggle/',             AdminToggleUserView.as_view(),        name='admin-toggle-user'),
    path('admin/associations/',                      AdminAssociationsView.as_view(),      name='admin-associations'),
    path('admin/associations/<uuid:pk>/reject/',     RejectAssociationView.as_view(),      name='admin-reject-association'),
    path('admin/campaigns/',                         AdminCampaignsView.as_view(),         name='admin-campaigns'),
    path('admin/campaigns/<uuid:pk>/toggle/',        AdminToggleCampaignView.as_view(),    name='admin-toggle-campaign'),
    path('admin/donations/',                         AdminDonationsView.as_view(),         name='admin-donations'),
]