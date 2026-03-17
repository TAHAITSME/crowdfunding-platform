# backend/apps/users/urls.py
from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import RegisterView, ProfileView
from .views import RegisterView, ProfileView, MeView
urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/',    TokenObtainPairView.as_view(), name='login'),
    path('auth/refresh/',  TokenRefreshView.as_view(), name='token_refresh'),
    path('users/<uuid:pk>/', ProfileView.as_view(), name='profile'),
    path('auth/me/', MeView.as_view(), name='me'),
]
