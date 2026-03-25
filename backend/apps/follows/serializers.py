from rest_framework import serializers
from .models import Follow
from apps.users.models import User, Profile


class UserBriefSerializer(serializers.ModelSerializer):
    """Sérialiser un utilisateur avec ses infos basiques + avatar"""
    avatar = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'avatar']
    
    def get_avatar(self, obj):
        """Récupère l'avatar depuis le profil de l'utilisateur"""
        if hasattr(obj, 'profile') and obj.profile and obj.profile.avatar:
            return self.context.get('request').build_absolute_uri(obj.profile.avatar.url)
        return None


class FollowSerializer(serializers.ModelSerializer):
    follower = UserBriefSerializer(read_only=True)
    following = UserBriefSerializer(read_only=True)
    
    class Meta:
        model = Follow
        fields = ['id', 'follower', 'following', 'created_at']
        read_only_fields = ['id', 'created_at']


class FollowToggleSerializer(serializers.Serializer):
    """Serializer pour la réponse du toggle follow"""
    is_following = serializers.BooleanField()
    message = serializers.CharField()
