# apps/messaging/serializers.py
from rest_framework import serializers
from .models import Conversation, Message
from apps.users.models import User


class ParticipantSerializer(serializers.ModelSerializer):
    avatar    = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = ['id', 'username', 'full_name', 'avatar']

    def get_avatar(self, obj):
        request = self.context.get('request')
        try:
            avatar = obj.profile.avatar
            if avatar:
                return request.build_absolute_uri(avatar.url) if request else avatar.url
        except: pass
        return None

    def get_full_name(self, obj):
        name = f"{obj.first_name} {obj.last_name}".strip()
        return name or obj.username


class MessageSerializer(serializers.ModelSerializer):
    # ✅ read_only → pas requis dans le POST
    sender      = ParticipantSerializer(read_only=True)
    conversation = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model  = Message
        fields = ['id', 'conversation', 'sender', 'content',
                  'media', 'is_read', 'created_at']
        read_only_fields = ['id', 'sender', 'conversation',
                            'is_read', 'created_at']
        extra_kwargs = {
            'content': {'required': False},  # ✅ géré dans perform_create
            'media':   {'required': False},
        }


class ConversationSerializer(serializers.ModelSerializer):
    participants  = ParticipantSerializer(many=True, read_only=True)
    last_message  = serializers.SerializerMethodField()
    unread_count  = serializers.SerializerMethodField()

    class Meta:
        model  = Conversation
        fields = ['id', 'participants', 'last_message',
                  'unread_count', 'created_at', 'updated_at']

    def get_last_message(self, obj):
        msg = obj.messages.order_by('-created_at').first()
        if not msg: return None
        return {
            'content':    msg.content,
            'created_at': msg.created_at,
            'is_mine':    msg.sender == self.context.get('request').user
                          if self.context.get('request') else False,
        }

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if not request: return 0
        return obj.messages.filter(
            is_read=False
        ).exclude(sender=request.user).count()
