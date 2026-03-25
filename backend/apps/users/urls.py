from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import RegisterView, ProfileView, MeView, MeProfileView, UserPublicProfileView
from .views import UpdateProfileView, ChangePasswordView, TogglePrivacyView


urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', TokenObtainPairView.as_view(), name='login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', MeView.as_view(), name='me'),
    path('auth/me/profile/', MeProfileView.as_view(), name='me-profile'),
    path('users/<uuid:id>/', UserPublicProfileView.as_view(), name='user-public-profile'),
    path('auth/profile/update/', UpdateProfileView.as_view()),
    path('auth/change-password/', ChangePasswordView.as_view()),
    path('auth/privacy/', TogglePrivacyView.as_view()),
]
