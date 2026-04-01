# backend/apps/donations/serializers.py

from rest_framework import serializers
from .models import Donation
from apps.campaigns.models import Campaign


class DonationSerializer(serializers.ModelSerializer):
    donor_name = serializers.SerializerMethodField()
    campaign_title = serializers.CharField(source='campaign.title', read_only=True)

    class Meta:
        model = Donation
        fields = [
            'id',
            'donor_name',
            'campaign',
            'campaign_title',
            'amount',
            'commission_amount',
            'net_amount',
            'status',
            'is_anonymous',
            'created_at',
        ]
        read_only_fields = [
            'id',
            'commission_amount',
            'net_amount',
            'status',
            'created_at'
        ]

    def get_donor_name(self, obj):
        if obj.is_anonymous:
            return "Anonyme"
        return obj.donor.username


# 🔥 Serializer corrigé
class CreateDonationSerializer(serializers.Serializer):
    # ✅ Remplace campaign_id par campaign directement
    campaign = serializers.PrimaryKeyRelatedField(
        queryset=Campaign.objects.filter(is_active=True)
    )

    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    is_anonymous = serializers.BooleanField(default=False)

    # ✅ (optionnel mais recommandé) validation supplémentaire
    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Le montant doit être supérieur à 0.")
        return value