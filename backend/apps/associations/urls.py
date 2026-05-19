# backend/apps/associations/urls.py
from django.urls import path
from .views import (
    AssociationRegisterView,
    AssociationDetailView,
    AssociationListView,
    ApproveAssociationView,
    AdminAssociationReviewView,
    MeAssociationRequestView,
)

urlpatterns = [
    path('associations/register/', AssociationRegisterView.as_view(), name='association-register'),
    path('associations/',          AssociationListView.as_view(),     name='association-list'),
    path('associations/me/request/', MeAssociationRequestView.as_view(), name='association-me-request'),
    path('associations/<uuid:pk>/', AssociationDetailView.as_view(),  name='association-detail'),
    path('associations/<uuid:pk>/approve/', ApproveAssociationView.as_view(), name='association-approve'),
    path('admin/associations/<uuid:pk>/<str:action>/', AdminAssociationReviewView.as_view(), name='association-admin-review'),
]
