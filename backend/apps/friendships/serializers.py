from rest_framework import serializers

from apps.users.models import User
from .models import Friendship


class FriendUserSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "full_name", "email", "role", "avatar"]

    def get_full_name(self, obj):
        return obj.full_name or f"{obj.first_name} {obj.last_name}".strip() or obj.username

    def get_avatar(self, obj):
        request = self.context.get("request")
        try:
            avatar = obj.profile.avatar
            if avatar:
                return request.build_absolute_uri(avatar.url) if request else avatar.url
        except Exception:
            return None
        return None


class FriendshipSerializer(serializers.ModelSerializer):
    requester = FriendUserSerializer(read_only=True)
    addressee = FriendUserSerializer(read_only=True)
    friend = serializers.SerializerMethodField()
    direction = serializers.SerializerMethodField()

    class Meta:
        model = Friendship
        fields = [
            "id",
            "requester",
            "addressee",
            "friend",
            "direction",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_friend(self, obj):
        request = self.context.get("request")
        context_user = self.context.get("friend_context_user") or getattr(request, "user", None)
        if not context_user:
            return None
        other = obj.other_user(context_user)
        return FriendUserSerializer(other, context=self.context).data if other else None

    def get_direction(self, obj):
        request = self.context.get("request")
        if not request:
            return None
        return "outgoing" if obj.requester_id == request.user.id else "incoming"
