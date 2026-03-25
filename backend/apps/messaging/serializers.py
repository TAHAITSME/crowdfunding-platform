from rest_framework import serializers
from .models import Conversation, Message
from apps.users.models import User


class SenderSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'full_name', 'avatar']

    def get_avatar(self, obj):
        req = self.context.get('request')
        try:
            if obj.profile.avatar:
                return req.build_absolute_uri(obj.profile.avatar.url) if req else f'http://localhost:8000{obj.profile.avatar.url}'
        except: pass
        return None


class MessageSerializer(serializers.ModelSerializer):
    sender = SenderSerializer(read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'conversation', 'sender', 'content', 'media', 'is_read', 'created_at']
        read_only_fields = ['id', 'sender', 'created_at']


class ConversationSerializer(serializers.ModelSerializer):
    participants    = SenderSerializer(many=True, read_only=True)
    last_message    = serializers.SerializerMethodField()
    unread_count    = serializers.SerializerMethodField()
    other_user      = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ['id', 'participants', 'other_user', 'last_message', 'unread_count', 'created_at', 'updated_at']

    def get_last_message(self, obj):
        msg = obj.messages.last()
        if msg:
            return {'content': msg.content, 'created_at': msg.created_at, 'sender_id': str(msg.sender_id)}
        return None

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request:
            return obj.messages.filter(is_read=False).exclude(sender=request.user).count()
        return 0

    def get_other_user(self, obj):
        request = self.context.get('request')
        if request:
            other = obj.participants.exclude(id=request.user.id).first()
            if other:
                return SenderSerializer(other, context=self.context).data
        return None
