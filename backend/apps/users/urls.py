from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, LoginView, ProfileView, MeView, MeProfileView,
    SearchView, UserPublicProfileView, MutualFriendsView,
    UpdateProfileView, ChangePasswordView, TogglePrivacyView,
    AdminStatsView, AdminUsersView, AdminUserDetailView, AdminToggleUserView,
    AdminAssociationsView, AdminAssociationActionView,
    AdminCampaignsView, AdminCampaignActionView, AdminCampaignDonationsOverTimeView,
    AdminDonationsView, AdminAlertsView, AdminExportView,
    AdminPostsView, AdminPostDetailView, AdminCommentsView, AdminCommentDetailView,
)

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', MeView.as_view(), name='me'),
    path('auth/me/profile/', MeProfileView.as_view(), name='me-profile'),
    path('auth/profile/update/', UpdateProfileView.as_view()),
    path('auth/change-password/', ChangePasswordView.as_view()),
    path('auth/privacy/', TogglePrivacyView.as_view()),

    path('users/<uuid:id>/', UserPublicProfileView.as_view(), name='user-public-profile'),
    path('users/<uuid:user_id>/mutual-friends/', MutualFriendsView.as_view(), name='user-mutual-friends'),
    path('search/', SearchView.as_view(), name='search'),

    path('admin/stats/', AdminStatsView.as_view(), name='admin-stats'),
    path('admin/alerts/', AdminAlertsView.as_view(), name='admin-alerts'),
    path('admin/export/<str:resource>/', AdminExportView.as_view(), name='admin-export'),
    path('admin/users/', AdminUsersView.as_view(), name='admin-users'),
    path('admin/users/<uuid:pk>/', AdminUserDetailView.as_view(), name='admin-user-detail'),
    path('admin/users/<uuid:pk>/suspend/', AdminToggleUserView.as_view(), name='admin-toggle-user'),
    path('admin/associations/', AdminAssociationsView.as_view(), name='admin-associations'),
    path('admin/associations/<uuid:pk>/<str:action>/', AdminAssociationActionView.as_view(), name='admin-association-action'),
    path('admin/campaigns/', AdminCampaignsView.as_view(), name='admin-campaigns'),
    path('admin/campaigns/<uuid:pk>/donations-over-time/', AdminCampaignDonationsOverTimeView.as_view(), name='admin-campaign-donations-over-time'),
    path('admin/campaigns/<uuid:pk>/<str:action>/', AdminCampaignActionView.as_view(), name='admin-campaign-action'),
    path('admin/donations/', AdminDonationsView.as_view(), name='admin-donations'),
    path('admin/posts/', AdminPostsView.as_view(), name='admin-posts'),
    path('admin/posts/<uuid:pk>/', AdminPostDetailView.as_view(), name='admin-post-detail'),
    path('admin/comments/', AdminCommentsView.as_view(), name='admin-comments'),
    path('admin/comments/<uuid:pk>/', AdminCommentDetailView.as_view(), name='admin-comment-detail'),
]
