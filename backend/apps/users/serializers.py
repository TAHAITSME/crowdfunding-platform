# backend/apps/users/serializers.py
from rest_framework import serializers
from .models import User

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'phone', 'cin']

    def create(self, validated_data):
        # create_user hashé le mot de passe automatiquement
        return User.objects.create_user(**validated_data)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'avatar',
                  'bio', 'role', 'is_verified', 'dark_mode', 'created_at']
        read_only_fields = ['id', 'created_at', 'role', 'is_verified']
