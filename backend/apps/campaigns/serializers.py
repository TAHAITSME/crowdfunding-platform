# backend/apps/campaigns/serializers.py
from rest_framework import serializers
from .models import Campaign
from apps.associations.serializers import AssociationSerializer


class CampaignSerializer(serializers.ModelSerializer):
    # Champs calculés — lecture seule
    progress_percentage = serializers.ReadOnlyField()
    is_completed        = serializers.ReadOnlyField()
    is_expired          = serializers.ReadOnlyField()
    association_name    = serializers.CharField(source='association.name', read_only=True)

    class Meta:
        model  = Campaign
        fields = [
            'id', 'association', 'association_name',
            'title', 'description', 'goal_amount', 'current_amount',
            'category', 'deadline', 'image', 'is_active',
            'progress_percentage', 'is_completed', 'is_expired',
            'created_at',
        ]
        read_only_fields = ['id', 'current_amount', 'created_at']

    def validate(self, data):
        """Vérifier que la deadline est dans le futur"""
        from django.utils import timezone
        if data.get('deadline') and data['deadline'] <= timezone.now():
            raise serializers.ValidationError("La deadline doit être dans le futur.")
        return data
