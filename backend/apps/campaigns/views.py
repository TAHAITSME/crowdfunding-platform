# backend/apps/campaigns/views.py
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import Campaign
from .serializers import CampaignSerializer


class IsAssociation(permissions.BasePermission):
    """Seules les associations approuvées peuvent créer/modifier des campagnes"""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return (
            request.user.is_authenticated and
            request.user.role == 'association' and
            hasattr(request.user, 'association') and
            request.user.association.is_approved
        )

    # ✅ DÉPLACÉ ici depuis la vue
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.association == request.user.association


class CampaignListCreateView(generics.ListCreateAPIView):
    serializer_class   = CampaignSerializer
    permission_classes = [IsAssociation]

    def get_queryset(self):
        queryset = Campaign.objects.filter(is_active=True).select_related('association')
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        return queryset

    def perform_create(self, serializer):
        serializer.save(association=self.request.user.association)


class CampaignDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = CampaignSerializer
    permission_classes = [IsAssociation]
    queryset           = Campaign.objects.all()