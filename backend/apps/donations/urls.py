# backend/apps/donations/urls.py
from django.urls import path
from .views import MakeDonationView, DonationHistoryView

urlpatterns = [
    path('donations/',         MakeDonationView.as_view(),    name='make-donation'),
    path('donations/history/', DonationHistoryView.as_view(), name='donation-history'),
]
