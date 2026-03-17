from rest_framework import serializers
from .models import Post, SavedPost


class PostSerializer(serializers.ModelSerializer):
    author_username         = serializers.CharField(source='author.username', read_only=True)
    author_avatar           = serializers.ImageField(source='author.avatar', read_only=True)
    tagged_association_name = serializers.CharField(
        source='tagged_association.name', read_only=True
    )
    likes_count = serializers.SerializerMethodField()
    is_liked    = serializers.SerializerMethodField()

    class Meta:
        model  = Post
        fields = [
            'id', 'author', 'author_username', 'author_avatar',
            'content', 'post_type', 'media',
            'tagged_association', 'tagged_association_name',
            'is_repost', 'original_post',
            'is_visible', 'views_count', 'created_at',
            'likes_count', 'is_liked',
        ]
        read_only_fields = ['id', 'author', 'views_count', 'created_at']

    def get_likes_count(self, obj):
        return obj.likes.count()

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False

    def validate(self, data):
        if data.get('post_type') == Post.SOLIDARITY and not data.get('tagged_association'):
            raise serializers.ValidationError(
                "Un post solidaire doit mentionner une association."
            )
        return data
