# backend/apps/donations/serializers.py
from rest_framework import serializers
from .models import Donation


class DonationSerializer(serializers.ModelSerializer):
    donor_name    = serializers.SerializerMethodField()
    campaign_title = serializers.CharField(source='campaign.title', read_only=True)

    class Meta:
        model  = Donation
        fields = [
            'id', 'donor_name', 'campaign', 'campaign_title',
            'amount', 'commission_amount', 'net_amount',
            'status', 'is_anonymous', 'created_at',
        ]
        read_only_fields = ['id', 'commission_amount', 'net_amount',
                            'status', 'created_at']

    def get_donor_name(self, obj):
        # Si don anonyme → cacher le nom
        if obj.is_anonymous:
            return "Anonyme"
        return obj.donor.username


class CreateDonationSerializer(serializers.Serializer):
    campaign_id  = serializers.UUIDField()
    amount       = serializers.DecimalField(max_digits=10, decimal_places=2)
    is_anonymous = serializers.BooleanField(default=False)
