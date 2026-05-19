from rest_framework import serializers

from apps.posts.serializers import PostMediaSerializer, build_media_url
from apps.users.models import User
from .models import CallSession, Conversation, Message


class ParticipantSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "full_name", "avatar"]

    def get_avatar(self, obj):
        try:
            return build_media_url(self.context.get("request"), obj.profile.avatar)
        except Exception:
            return None

    def get_full_name(self, obj):
        name = f"{obj.first_name} {obj.last_name}".strip()
        return name or obj.full_name or obj.username


class MessageSerializer(serializers.ModelSerializer):
    sender = ParticipantSerializer(read_only=True)
    conversation = serializers.PrimaryKeyRelatedField(read_only=True)
    shared_post_preview = serializers.SerializerMethodField()
    media_url = serializers.SerializerMethodField()
    location = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = [
            "id",
            "conversation",
            "sender",
            "message_type",
            "content",
            "media",
            "media_url",
            "file_name",
            "location_lat",
            "location_lng",
            "location",
            "shared_post",
            "shared_post_preview",
            "is_read",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "sender",
            "conversation",
            "message_type",
            "media_url",
            "location",
            "shared_post_preview",
            "is_read",
            "created_at",
        ]
        extra_kwargs = {
            "content": {"required": False},
            "media": {"required": False},
            "file_name": {"required": False},
            "location_lat": {"required": False},
            "location_lng": {"required": False},
            "shared_post": {"required": False, "allow_null": True},
        }

    def get_media_url(self, obj):
        return build_media_url(self.context.get("request"), obj.media)

    def get_location(self, obj):
        if obj.location_lat is None or obj.location_lng is None:
            return None
        return {
            "lat": obj.location_lat,
            "lng": obj.location_lng,
            "google_maps_url": f"https://www.google.com/maps?q={obj.location_lat},{obj.location_lng}",
        }

    def get_shared_post_preview(self, obj):
        if obj.message_type == Message.TYPE_SHARED_POST and not obj.shared_post:
            return {"unavailable": True}

        post = obj.shared_post
        if not post:
            return None

        request = self.context.get("request")
        return {
            "id": str(post.id),
            "author": {
                "id": str(post.author.id),
                "username": post.author.username,
                "full_name": post.author.full_name or post.author.username,
                "avatar": build_media_url(request, getattr(post.author.profile, "avatar", None))
                if hasattr(post.author, "profile") else None,
            },
            "content": post.content,
            "media": build_media_url(request, post.media),
            "media_items": PostMediaSerializer(
                post.media_items.all(),
                many=True,
                context=self.context,
            ).data,
            "is_visible": post.is_visible,
        }


class ConversationSerializer(serializers.ModelSerializer):
    participants = ParticipantSerializer(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ["id", "participants", "last_message", "unread_count", "created_at", "updated_at"]

    def get_last_message(self, obj):
        msg = obj.messages.order_by("-created_at").first()
        if not msg:
            return None

        content = msg.content
        if msg.message_type == Message.TYPE_SHARED_POST:
            content = "Publication partagee"
        elif msg.message_type == Message.TYPE_LOCATION:
            content = "Localisation partagee"
        elif msg.message_type == Message.TYPE_IMAGE:
            content = "Image"
        elif msg.message_type == Message.TYPE_VIDEO:
            content = "Video"
        elif msg.message_type == Message.TYPE_AUDIO:
            content = "Audio"
        elif not content and msg.media:
            content = msg.file_name or "Fichier partage"

        return {
            "content": content,
            "created_at": msg.created_at,
            "is_mine": msg.sender == self.context.get("request").user
            if self.context.get("request") else False,
        }

    def get_unread_count(self, obj):
        request = self.context.get("request")
        if not request:
            return 0
        return obj.messages.filter(is_read=False).exclude(sender=request.user).count()


class CallSessionSerializer(serializers.ModelSerializer):
    caller = ParticipantSerializer(read_only=True)
    callee = ParticipantSerializer(read_only=True)
    remote_user = serializers.SerializerMethodField()
    is_caller = serializers.SerializerMethodField()
    pending_remote_candidates = serializers.SerializerMethodField()

    class Meta:
        model = CallSession
        fields = [
            "id",
            "conversation",
            "caller",
            "callee",
            "remote_user",
            "call_type",
            "status",
            "offer_sdp",
            "answer_sdp",
            "pending_remote_candidates",
            "is_caller",
            "started_at",
            "ended_at",
            "created_at",
            "updated_at",
        ]

    def get_is_caller(self, obj):
        request = self.context.get("request")
        return bool(request and obj.caller_id == request.user.id)

    def get_remote_user(self, obj):
        request = self.context.get("request")
        if not request:
            return None
        remote = obj.callee if obj.caller_id == request.user.id else obj.caller
        return ParticipantSerializer(remote, context=self.context).data

    def get_pending_remote_candidates(self, obj):
        request = self.context.get("request")
        if not request:
            return []
        if obj.caller_id == request.user.id:
            return obj.callee_candidates or []
        return obj.caller_candidates or []
