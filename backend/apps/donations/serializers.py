from rest_framework import serializers
from .models import Donation

class DonationSerializer(serializers.ModelSerializer):
    donor_name     = serializers.ReadOnlyField()
    donor_id       = serializers.CharField(source='donor.id', read_only=True)
    campaign_title = serializers.CharField(source='campaign.title', read_only=True)
    association_name = serializers.CharField(source='campaign.association.name', read_only=True)

    class Meta:
        model  = Donation
        fields = [
            'id', 'campaign', 'campaign_title', 'association_name', 'donor_id', 'donor_name',
            'amount', 'commission_amount', 'net_amount',
            'is_anonymous', 'message', 'status',
            'stripe_session_id', 'created_at',
        ]
        read_only_fields = ['commission_amount', 'net_amount', 'status', 'stripe_session_id', 'created_at']
