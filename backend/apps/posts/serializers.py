from rest_framework import serializers

from .models import Like, Post, PostMedia, SavedPost


def build_media_url(request, file_field):
    if not file_field:
        return None
    try:
        url = file_field.url
    except Exception:
        return None
    if request:
        return request.build_absolute_uri(url)
    return url


class PostMediaSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = PostMedia
        fields = ["id", "url", "sort_order"]

    def get_url(self, obj):
        return build_media_url(self.context.get("request"), obj.file)


class PostSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()
    media = serializers.SerializerMethodField()
    media_items = PostMediaSerializer(many=True, read_only=True)
    likes_count = serializers.SerializerMethodField()
    reposts_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    is_saved = serializers.SerializerMethodField()
    is_reposted = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    original_post_data = serializers.SerializerMethodField()
    tagged_association_name = serializers.CharField(
        source="tagged_association.name", read_only=True
    )

    class Meta:
        model = Post
        fields = [
            "id",
            "author",
            "content",
            "post_type",
            "media",
            "media_items",
            "location_name",
            "location_lat",
            "location_lng",
            "tagged_association",
            "tagged_association_name",
            "is_repost",
            "original_post",
            "original_post_data",
            "is_visible",
            "views_count",
            "created_at",
            "updated_at",
            "likes_count",
            "reposts_count",
            "is_liked",
            "is_saved",
            "is_reposted",
            "comments_count",
        ]
        read_only_fields = ["id", "views_count", "created_at", "updated_at"]
        extra_kwargs = {
            "content": {"allow_blank": True, "required": False},
        }

    def _target_post(self, obj):
        return obj.original_post if obj.is_repost and obj.original_post else obj

    def _author_payload(self, user):
        if not user:
            return None
        request = self.context.get("request")
        avatar_url = None
        try:
            if user.profile.avatar:
                avatar_url = build_media_url(request, user.profile.avatar)
        except Exception:
            pass

        return {
            "id": str(user.id),
            "username": user.username,
            "full_name": user.full_name or user.username,
            "avatar": avatar_url,
            "role": user.role,
        }

    def get_author(self, obj):
        return self._author_payload(obj.author)

    def get_media(self, obj):
        return build_media_url(self.context.get("request"), obj.media)

    def get_likes_count(self, obj):
        return self._target_post(obj).likes.count()

    def get_reposts_count(self, obj):
        target = self._target_post(obj)
        return Post.objects.filter(original_post=target, is_repost=True, is_visible=True).count()

    def get_is_liked(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return self._target_post(obj).likes.filter(user=request.user).exists()
        return False

    def get_is_saved(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return SavedPost.objects.filter(user=request.user, post=self._target_post(obj)).exists()
        return False

    def get_is_reposted(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            target = self._target_post(obj)
            return Post.objects.filter(
                author=request.user,
                original_post=target,
                is_repost=True,
                is_visible=True,
            ).exists()
        return False

    def get_comments_count(self, obj):
        return self._target_post(obj).comments.filter(is_visible=True, parent=None).count()

    def get_original_post_data(self, obj):
        if not obj.is_repost or not obj.original_post:
            return None
        original = obj.original_post
        return {
            "id": str(original.id),
            "author": self._author_payload(original.author),
            "content": original.content,
            "media": build_media_url(self.context.get("request"), original.media),
            "media_items": PostMediaSerializer(
                original.media_items.all(),
                many=True,
                context=self.context,
            ).data,
            "likes_count": original.likes.count(),
            "comments_count": original.comments.filter(is_visible=True, parent=None).count(),
            "is_visible": original.is_visible,
            "created_at": original.created_at,
            "location_name": original.location_name,
            "location_lat": original.location_lat,
            "location_lng": original.location_lng,
            "post_type": original.post_type,
            "tagged_association_name": getattr(original.tagged_association, "name", None),
        }

    def validate(self, data):
        if data.get("post_type") == Post.SOLIDARITY and not data.get("tagged_association"):
            raise serializers.ValidationError(
                "Un post solidaire doit mentionner une association."
            )
        return data


class SavedPostSerializer(serializers.ModelSerializer):
    post = PostSerializer(read_only=True)

    class Meta:
        model = SavedPost
        fields = ["id", "user", "post", "created_at"]
        read_only_fields = ["id", "user", "created_at"]


class LikeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Like
        fields = ["id", "user", "post", "created_at"]
        read_only_fields = ["id", "user", "created_at"]
