# backend/apps/associations/urls.py
from django.urls import path
from .views import (
    AssociationRegisterView,
    AssociationDetailView,
    AssociationListView,
    ApproveAssociationView,
)

urlpatterns = [
    path('associations/register/', AssociationRegisterView.as_view(), name='association-register'),
    path('associations/',          AssociationListView.as_view(),     name='association-list'),
    path('associations/<uuid:pk>/', AssociationDetailView.as_view(),  name='association-detail'),
    path('associations/<uuid:pk>/approve/', ApproveAssociationView.as_view(), name='association-approve'),
]
