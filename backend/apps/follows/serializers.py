from rest_framework import serializers
from .models import Follow
from apps.users.models import User
from apps.users.serializers import build_absolute_url, get_mutual_friends_data


class UserBriefSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()
    mutual_friends = serializers.SerializerMethodField()
    mutual_friends_preview = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'avatar', 'full_name', 'mutual_friends', 'mutual_friends_preview']

    def get_full_name(self, obj):
        return obj.full_name or obj.username
    
    def get_avatar(self, obj):
        if hasattr(obj, 'profile') and obj.profile and obj.profile.avatar:
            return build_absolute_url(self.context.get('request'), obj.profile.avatar)
        return None

    def get_mutual_friends(self, obj):
        request = self.context.get('request')
        count, _ = get_mutual_friends_data(getattr(request, 'user', None), obj)
        return count

    def get_mutual_friends_preview(self, obj):
        request = self.context.get('request')
        _, preview = get_mutual_friends_data(getattr(request, 'user', None), obj)
        return preview


class FollowSerializer(serializers.ModelSerializer):
    follower = UserBriefSerializer(read_only=True)
    following = UserBriefSerializer(read_only=True)
    
    class Meta:
        model = Follow
        fields = ['id', 'follower', 'following', 'created_at']
