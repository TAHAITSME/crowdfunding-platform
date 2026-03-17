# backend/apps/associations/serializers.py
from rest_framework import serializers
from .models import Association
from apps.users.models import User


class AssociationRegisterSerializer(serializers.ModelSerializer):
    """Inscription d'une association — crée le User + l'Association en même temps"""
    username = serializers.CharField(write_only=True)
    email    = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model  = Association
        fields = ['username', 'email', 'password',
                  'name', 'description', 'logo', 'document',
                  'location', 'website', 'facebook', 'instagram']

    def create(self, validated_data):
        # Extraire les données du User
        username = validated_data.pop('username')
        email    = validated_data.pop('email')
        password = validated_data.pop('password')

        # Créer le compte User avec le rôle "association"
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            role=User.ROLE_ASSOCIATION,
            is_verified=False,  # Inactif jusqu'à validation admin
        )

        # Créer le profil Association lié au User
        association = Association.objects.create(user=user, **validated_data)
        return association


class AssociationSerializer(serializers.ModelSerializer):
    """Lecture du profil d'une association"""
    username = serializers.CharField(source='user.username', read_only=True)
    email    = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model  = Association
        fields = ['id', 'username', 'email', 'name', 'description',
                  'logo', 'location', 'website', 'facebook', 'instagram',
                  'is_approved', 'total_collected', 'created_at']
