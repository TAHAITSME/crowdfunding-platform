from rest_framework import serializers
from .models import Post, SavedPost, Like
from apps.users.models import Profile


class PostSerializer(serializers.ModelSerializer):
    # ✅ Remplacé par un objet author complet
    author = serializers.SerializerMethodField()

    likes_count    = serializers.SerializerMethodField()
    is_liked       = serializers.SerializerMethodField()
    is_saved       = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    tagged_association_name = serializers.CharField(
        source="tagged_association.name", read_only=True
    )

    class Meta:
        model = Post
        fields = [
            "id",
            "author",              # ✅ objet complet {id, username, full_name, avatar, role}
            "content",
            "post_type",
            "media",
            "tagged_association",
            "tagged_association_name",
            "is_repost",
            "original_post",
            "is_visible",
            "views_count",
            "created_at",
            "likes_count",
            "is_liked",
            "is_saved",
            "comments_count",
        ]
        read_only_fields = ["id", "views_count", "created_at"]

    def get_author(self, obj):
        """✅ Retourne toutes les infos de l'auteur dont full_name + avatar depuis Profile"""
        user = obj.author
        if not user:
            return None

        request = self.context.get("request")

        # Avatar depuis Profile
        avatar_url = None
        try:
            if user.profile.avatar:
                if request:
                    avatar_url = request.build_absolute_uri(user.profile.avatar.url)
                else:
                    avatar_url = f'http://localhost:8000{user.profile.avatar.url}'
        except Exception:
            pass

        return {
            "id":        str(user.id),
            "username":  user.username,
            "full_name": user.full_name or user.username,  # ✅ nom complet
            "avatar":    avatar_url,
            "role":      user.role,
        }

    def get_likes_count(self, obj):
        return obj.likes.count()

    def get_is_liked(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False

    def get_is_saved(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return SavedPost.objects.filter(user=request.user, post=obj).exists()
        return False

    def get_comments_count(self, obj):
        return obj.comments.filter(is_visible=True).count()

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


class ProfileSerializer(serializers.ModelSerializer):
    username  = serializers.CharField(source="user.username", read_only=True)
    full_name = serializers.CharField(source="user.full_name", read_only=True)  # ✅
    avatar    = serializers.SerializerMethodField()

    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    is_followed     = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = [
            "id", "user", "username", "full_name",  # ✅
            "avatar", "privacy",
            "followers_count", "following_count", "is_followed",
        ]
        read_only_fields = ["id", "user"]

    def get_avatar(self, obj):
        request = self.context.get("request")
        try:
            if obj.avatar:
                return request.build_absolute_uri(obj.avatar.url) if request else f'http://localhost:8000{obj.avatar.url}'
        except: pass
        return None

    def get_followers_count(self, obj):
        try:
            from apps.follows.models import Follow
            return Follow.objects.filter(following=obj.user).count()
        except: return 0

    def get_following_count(self, obj):
        try:
            from apps.follows.models import Follow
            return Follow.objects.filter(follower=obj.user).count()
        except: return 0

    def get_is_followed(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            try:
                from apps.follows.models import Follow
                return Follow.objects.filter(follower=request.user, following=obj.user).exists()
            except: pass
        return False
