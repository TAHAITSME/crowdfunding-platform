# backend/apps/campaigns/views.py
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import Campaign
from .serializers import CampaignSerializer
from apps.associations.models import Association


class IsAssociation(permissions.BasePermission):
    """Permission personnalisée : seules les associations approuvées peuvent créer des campagnes"""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True  # Tout le monde peut lire
        return (
            request.user.is_authenticated and
            request.user.role == 'association' and
            hasattr(request.user, 'association') and
            request.user.association.is_approved
        )


class CampaignListCreateView(generics.ListCreateAPIView):
    serializer_class   = CampaignSerializer
    permission_classes = [IsAssociation]

    def get_queryset(self):
        queryset = Campaign.objects.filter(is_active=True).select_related('association')
        # Filtres par catégorie
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        return queryset

    def perform_create(self, serializer):
        """Associe automatiquement la campagne à l'association connectée"""
        serializer.save(association=self.request.user.association)


class CampaignDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = CampaignSerializer
    permission_classes = [IsAssociation]
    queryset           = Campaign.objects.all()

    def has_object_permission(self, request, view, obj):
        """Seule l'association propriétaire peut modifier/supprimer"""
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.association == request.user.association
