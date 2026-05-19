# backend/apps/associations/serializers.py
from django.utils import timezone
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
    user_id = serializers.CharField(source='user.id', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    email    = serializers.EmailField(source='user.email', read_only=True)
    phone = serializers.CharField(source='user.phone', read_only=True)
    is_verified = serializers.BooleanField(source='is_approved', read_only=True)
    campaigns_count = serializers.IntegerField(source='campaigns.count', read_only=True)
    posts_count = serializers.IntegerField(source='user.posts.count', read_only=True)
    followers_count = serializers.SerializerMethodField()
    document_url = serializers.SerializerMethodField()
    logo_url = serializers.SerializerMethodField()
    cover_image_url = serializers.SerializerMethodField()
    moderation_status_label = serializers.CharField(source='get_moderation_status_display', read_only=True)
    rejection_field_labels = serializers.SerializerMethodField()
    last_rejection_field_labels = serializers.SerializerMethodField()
    was_resubmitted = serializers.SerializerMethodField()
    reviewed_by_name = serializers.SerializerMethodField()

    class Meta:
        model  = Association
        fields = ['id', 'user_id', 'username', 'email', 'phone', 'name', 'description',
                  'logo', 'logo_url', 'cover_image_url', 'document', 'document_url', 'location', 'website', 'facebook', 'instagram',
                  'moderation_status', 'moderation_status_label', 'is_approved', 'is_verified', 'campaigns_count', 'posts_count', 'followers_count',
                  'rejection_fields', 'rejection_field_labels', 'rejection_reason',
                  'last_rejection_fields', 'last_rejection_field_labels', 'last_rejection_reason',
                  'reviewed_at', 'reviewed_by', 'reviewed_by_name', 'resubmitted_at', 'was_resubmitted',
                  'total_collected', 'created_at']
        read_only_fields = fields

    def get_document_url(self, obj):
        if not obj.document:
            return None
        request = self.context.get('request')
        return request.build_absolute_uri(obj.document.url) if request else obj.document.url

    def get_logo_url(self, obj):
        if not obj.logo:
            return None
        request = self.context.get('request')
        return request.build_absolute_uri(obj.logo.url) if request else obj.logo.url

    def get_cover_image_url(self, obj):
        profile = getattr(obj.user, 'profile', None)
        if not profile or not profile.cover_image:
            return None
        request = self.context.get('request')
        return request.build_absolute_uri(profile.cover_image.url) if request else profile.cover_image.url

    def get_followers_count(self, obj):
        return obj.user.followers_set.count()

    def get_rejection_field_labels(self, obj):
        return [Association.REJECTION_FIELD_LABELS.get(item, item) for item in (obj.rejection_fields or [])]

    def get_last_rejection_field_labels(self, obj):
        return [Association.REJECTION_FIELD_LABELS.get(item, item) for item in (obj.last_rejection_fields or [])]

    def get_was_resubmitted(self, obj):
        return bool(obj.resubmitted_at)

    def get_reviewed_by_name(self, obj):
        if not obj.reviewed_by:
            return None
        return obj.reviewed_by.full_name or obj.reviewed_by.username or obj.reviewed_by.email


class AssociationRejectionSerializer(serializers.Serializer):
    rejection_fields = serializers.ListField(
        child=serializers.CharField(),
        allow_empty=False,
    )
    rejection_reason = serializers.CharField(allow_blank=False, trim_whitespace=True)

    def validate_rejection_fields(self, value):
        allowed = set(Association.REJECTION_FIELD_LABELS.keys())
        normalized = []
        for item in value:
            key = (item or '').strip().lower()
            if key not in allowed:
                raise serializers.ValidationError(f'Champ de rejet invalide: {item}')
            if key not in normalized:
                normalized.append(key)
        if not normalized:
            raise serializers.ValidationError('Selectionnez au moins un champ a corriger.')
        return normalized


class AssociationSelfRequestSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email')
    phone = serializers.CharField(source='user.phone', allow_blank=True)
    full_name = serializers.CharField(source='user.full_name', allow_blank=True, required=False)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    document_url = serializers.SerializerMethodField()
    correction_fields = serializers.SerializerMethodField()
    correction_field_labels = serializers.SerializerMethodField()
    correction_reason = serializers.SerializerMethodField()
    correction_status = serializers.SerializerMethodField()
    reviewed_by_name = serializers.SerializerMethodField()
    was_rejected_before = serializers.SerializerMethodField()

    class Meta:
        model = Association
        fields = [
            'id', 'name', 'description', 'location', 'website', 'facebook', 'instagram',
            'document', 'document_url',
            'email', 'phone', 'full_name', 'password', 'confirm_password',
            'moderation_status', 'is_approved',
            'rejection_fields', 'rejection_reason',
            'last_rejection_fields', 'last_rejection_reason',
            'reviewed_at', 'reviewed_by', 'reviewed_by_name', 'resubmitted_at',
            'correction_fields', 'correction_field_labels', 'correction_reason', 'correction_status',
            'was_rejected_before',
        ]
        read_only_fields = [
            'id', 'document_url', 'moderation_status', 'is_approved',
            'rejection_fields', 'rejection_reason',
            'last_rejection_fields', 'last_rejection_reason',
            'reviewed_at', 'reviewed_by', 'reviewed_by_name', 'resubmitted_at',
            'correction_fields', 'correction_field_labels', 'correction_reason', 'correction_status',
            'was_rejected_before',
        ]

    def validate(self, attrs):
        password = attrs.get('password')
        confirm_password = attrs.pop('confirm_password', '')
        if password and password != confirm_password:
            raise serializers.ValidationError({'confirm_password': 'Les mots de passe ne correspondent pas.'})
        email = attrs.get('user', {}).get('email')
        if email:
            exists = User.objects.filter(email=email).exclude(pk=self.instance.user_id).exists()
            if exists:
                raise serializers.ValidationError({'email': 'Cet email est deja utilise.'})
        return attrs

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        password = validated_data.pop('password', '')

        for field, value in validated_data.items():
            setattr(instance, field, value)

        email = user_data.get('email')
        if email:
            instance.user.email = email
        if 'phone' in user_data:
            instance.user.phone = user_data.get('phone', '')
        full_name = user_data.get('full_name')
        if full_name is not None:
            instance.user.full_name = full_name
            if full_name.strip():
                instance.name = full_name.strip()
        else:
            instance.user.full_name = instance.name
        if password:
            instance.user.set_password(password)

        if instance.document:
            instance.user.document = instance.document

        instance.moderation_status = Association.STATUS_PENDING
        instance.is_approved = False
        instance.last_rejection_fields = list(instance.rejection_fields or instance.last_rejection_fields or [])
        instance.last_rejection_reason = instance.rejection_reason or instance.last_rejection_reason
        instance.rejection_fields = []
        instance.rejection_reason = ''
        instance.resubmitted_at = timezone.now()

        instance.user.is_verified = False
        instance.user.save()
        instance.save()
        return instance

    def get_document_url(self, obj):
        if not obj.document:
            return None
        request = self.context.get('request')
        return request.build_absolute_uri(obj.document.url) if request else obj.document.url

    def get_reviewed_by_name(self, obj):
        if not obj.reviewed_by:
            return None
        return obj.reviewed_by.full_name or obj.reviewed_by.username or obj.reviewed_by.email

    def get_correction_fields(self, obj):
        return list(obj.rejection_fields or obj.last_rejection_fields or [])

    def get_correction_field_labels(self, obj):
        return [Association.REJECTION_FIELD_LABELS.get(item, item) for item in self.get_correction_fields(obj)]

    def get_correction_reason(self, obj):
        return obj.rejection_reason or obj.last_rejection_reason

    def get_correction_status(self, obj):
        if obj.moderation_status == Association.STATUS_REJECTED:
            return 'rejected'
        if obj.moderation_status == Association.STATUS_PENDING and obj.resubmitted_at:
            return 'resubmitted'
        if obj.moderation_status == Association.STATUS_APPROVED:
            return 'approved'
        return 'pending'

    def get_was_rejected_before(self, obj):
        return bool(obj.last_rejection_reason or obj.last_rejection_fields or obj.resubmitted_at)
