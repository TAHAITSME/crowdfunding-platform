# backend/apps/campaigns/urls.py
from django.urls import path
from .views import CampaignListCreateView, CampaignDetailView

urlpatterns = [
    path('campaigns/',          CampaignListCreateView.as_view(), name='campaign-list'),
    path('campaigns/<uuid:pk>/', CampaignDetailView.as_view(),    name='campaign-detail'),
]
