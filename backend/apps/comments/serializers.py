from rest_framework import serializers
from .models import Comment


class ReplySerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source='author.username', read_only=True)

    class Meta:
        model  = Comment
        fields = ['id', 'author', 'author_username', 'content', 'created_at']
        read_only_fields = ['id', 'author', 'created_at']


class CommentSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source='author.username', read_only=True)
    replies         = ReplySerializer(many=True, read_only=True)

    class Meta:
        model  = Comment
        fields = [
            'id', 'post', 'author', 'author_username',
            'content', 'parent', 'replies',
            'is_visible', 'created_at'
        ]
        read_only_fields = ['id', 'post', 'author', 'created_at']
