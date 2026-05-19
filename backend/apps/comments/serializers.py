from rest_framework import serializers

from apps.users.serializers import build_absolute_url
from .models import Comment, CommentReaction


class ReplySerializer(serializers.ModelSerializer):
    author_id = serializers.UUIDField(source="author.id", read_only=True)
    author_username = serializers.CharField(source="author.username", read_only=True)
    author_full_name = serializers.SerializerMethodField()
    author_avatar = serializers.SerializerMethodField()
    reactions_count = serializers.SerializerMethodField()
    is_reacted = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = [
            "id",
            "author",
            "author_id",
            "author_username",
            "author_full_name",
            "author_avatar",
            "content",
            "created_at",
            "updated_at",
            "reactions_count",
            "is_reacted",
        ]
        read_only_fields = ["id", "author", "created_at", "updated_at"]

    def get_author_full_name(self, obj):
        return obj.author.full_name or obj.author.username

    def get_author_avatar(self, obj):
        request = self.context.get("request")
        try:
            return build_absolute_url(request, obj.author.profile.avatar)
        except Exception:
            return None

    def get_reactions_count(self, obj):
        return obj.reactions.count()

    def get_is_reacted(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.reactions.filter(user=request.user).exists()
        return False


class CommentSerializer(serializers.ModelSerializer):
    author_id = serializers.UUIDField(source="author.id", read_only=True)
    author_username = serializers.CharField(source="author.username", read_only=True)
    author_full_name = serializers.SerializerMethodField()
    author_avatar = serializers.SerializerMethodField()
    replies = serializers.SerializerMethodField()
    reactions_count = serializers.SerializerMethodField()
    is_reacted = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = [
            "id",
            "post",
            "author",
            "author_id",
            "author_username",
            "author_full_name",
            "author_avatar",
            "content",
            "parent",
            "replies",
            "is_visible",
            "created_at",
            "updated_at",
            "reactions_count",
            "is_reacted",
        ]
        read_only_fields = ["id", "post", "author", "created_at", "updated_at"]

    def get_author_full_name(self, obj):
        return obj.author.full_name or obj.author.username

    def get_author_avatar(self, obj):
        request = self.context.get("request")
        try:
            return build_absolute_url(request, obj.author.profile.avatar)
        except Exception:
            return None

    def get_replies(self, obj):
        replies = obj.replies.filter(is_visible=True).select_related("author", "author__profile")
        return ReplySerializer(replies, many=True, context=self.context).data

    def get_reactions_count(self, obj):
        return obj.reactions.count()

    def get_is_reacted(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.reactions.filter(user=request.user).exists()
        return False


class CommentReactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommentReaction
        fields = ["id", "comment", "user", "created_at"]
        read_only_fields = ["id", "user", "created_at"]
