# backend/apps/notifications/serializers.py
from rest_framework import serializers
from .models import Notification
from apps.users.models import User


class SenderBriefSerializer(serializers.ModelSerializer):
    avatar   = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = ['id', 'username', 'email', 'full_name', 'avatar']

    def get_avatar(self, obj):
        request = self.context.get('request')
        try:
            avatar = obj.profile.avatar
            if avatar:
                # ✅ Retourne l'URL absolue (http://localhost:8000/media/...)
                return request.build_absolute_uri(avatar.url) if request else avatar.url
        except Exception:
            pass
        return None

    def get_full_name(self, obj):
        full = f"{obj.first_name} {obj.last_name}".strip()
        return full if full else obj.username


class NotificationSerializer(serializers.ModelSerializer):
    sender = SenderBriefSerializer(read_only=True)

    class Meta:
        model  = Notification
        fields = ['id', 'sender', 'type', 'title', 'message', 'is_read', 'created_at']
        read_only_fields = ['id', 'sender', 'type', 'title', 'message', 'created_at']
