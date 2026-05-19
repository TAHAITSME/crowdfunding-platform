from rest_framework import serializers
from .models import Campaign


class CampaignSerializer(serializers.ModelSerializer):
    progress_percentage = serializers.ReadOnlyField()
    is_completed = serializers.ReadOnlyField()
    is_expired = serializers.ReadOnlyField()
    association_name = serializers.CharField(source='association.name', read_only=True)
    association_user_id = serializers.CharField(source='association.user.id', read_only=True)
    donor_count = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()
    started_at = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = Campaign
        fields = [
            'id', 'association', 'association_name', 'association_user_id',
            'title', 'description', 'goal_amount', 'current_amount',
            'category', 'deadline', 'image', 'status', 'is_active',
            'progress_percentage', 'is_completed', 'is_expired',
            'donor_count', 'status_display', 'started_at', 'created_at',
        ]
        read_only_fields = ['id', 'current_amount', 'status', 'created_at', 'association']

    def get_donor_count(self, obj):
        return obj.donations.filter(status='completed').exclude(donor=None).values('donor').distinct().count()

    def get_status_display(self, obj):
        if obj.status == Campaign.STATUS_SUSPENDED:
            return 'suspended'
        if obj.status == Campaign.STATUS_REJECTED:
            return 'rejected'
        if obj.status == Campaign.STATUS_PENDING:
            return 'pending'
        if obj.is_completed or obj.is_expired:
            return 'completed'
        if obj.status == Campaign.STATUS_APPROVED and obj.is_active:
            return 'active'
        return obj.status

    def validate(self, data):
        from django.utils import timezone
        if data.get('deadline') and data['deadline'] <= timezone.now():
            raise serializers.ValidationError("La deadline doit etre dans le futur.")
        return data
