from rest_framework import serializers
from .models import User, Profile


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    account_type = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = [
            'username', 'email', 'password',
            'phone', 'cin', 'full_name',
            'account_type', 'document'
        ]
        extra_kwargs = {
            'cin': {'required': False},
            'phone': {'required': False},
            'full_name': {'required': False},
            'document': {'required': False},
        }

    def create(self, validated_data):
        account_type = validated_data.pop('account_type', 'user')
        password = validated_data.pop('password')
        role = User.ROLE_ASSOCIATION if account_type == 'association' else User.ROLE_USER
        user = User(**validated_data)
        user.set_password(password)
        user.role = role
        if role == User.ROLE_ASSOCIATION:
            user.is_verified = False
        user.save()
        # ✅ Créer profil automatiquement
        Profile.objects.get_or_create(user=user)
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'phone', 'cin', 'full_name', 'role', 'is_verified', 'dark_mode', 'created_at']
        read_only_fields = ['id', 'created_at', 'role', 'is_verified']


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = [
            'id', 'avatar', 'cover_image',
            'headline', 'bio', 'location',
            'website', 'linkedin', 'privacy',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


def build_absolute_url(request, path):
    """Helper : construit l'URL absolue d'un media"""
    if not path:
        return None
    path_str = str(path)
    if path_str.startswith('http'):
        return path_str
    if request:
        return request.build_absolute_uri(f'/media/{path_str}')
    return f'http://localhost:8000/media/{path_str}'


class MeProfileDetailSerializer(serializers.Serializer):
    """GET /auth/me/profile/ — User + Profile combinés"""
    id              = serializers.SerializerMethodField()
    username        = serializers.SerializerMethodField()
    email           = serializers.SerializerMethodField()
    phone           = serializers.SerializerMethodField()
    full_name       = serializers.SerializerMethodField()   # ✅ AJOUTÉ
    role            = serializers.SerializerMethodField()
    is_verified     = serializers.SerializerMethodField()
    dark_mode       = serializers.SerializerMethodField()
    created_at      = serializers.SerializerMethodField()

    avatar          = serializers.SerializerMethodField()
    cover_image     = serializers.SerializerMethodField()
    headline        = serializers.SerializerMethodField()
    bio             = serializers.SerializerMethodField()
    location        = serializers.SerializerMethodField()
    website         = serializers.SerializerMethodField()
    linkedin        = serializers.SerializerMethodField()
    privacy         = serializers.SerializerMethodField()

    posts_count     = serializers.SerializerMethodField()
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()

    def get_id(self, obj):          return str(obj.id)
    def get_username(self, obj):    return obj.username
    def get_email(self, obj):       return obj.email
    def get_phone(self, obj):       return obj.phone
    def get_full_name(self, obj):   return obj.full_name or obj.username  # ✅
    def get_role(self, obj):        return obj.role
    def get_is_verified(self, obj): return obj.is_verified
    def get_dark_mode(self, obj):   return obj.dark_mode
    def get_created_at(self, obj):  return obj.created_at

    def get_avatar(self, obj):
        try:
            req = self.context.get('request')
            return build_absolute_url(req, obj.profile.avatar)
        except: return None

    def get_cover_image(self, obj):
        try:
            req = self.context.get('request')
            return build_absolute_url(req, obj.profile.cover_image)
        except: return None

    def get_headline(self, obj):
        try: return obj.profile.headline
        except: return ''

    def get_bio(self, obj):
        try: return obj.profile.bio
        except: return ''

    def get_location(self, obj):
        try: return obj.profile.location
        except: return ''

    def get_website(self, obj):
        try: return obj.profile.website
        except: return ''

    def get_linkedin(self, obj):
        try: return obj.profile.linkedin
        except: return ''

    def get_privacy(self, obj):
        try: return obj.profile.privacy
        except: return 'public'

    def get_posts_count(self, obj):
        try: return obj.posts.count()
        except: return 0

    def get_followers_count(self, obj):
        # ✅ Follow model via related_name='followers_set'
        try:
            from apps.follows.models import Follow
            return Follow.objects.filter(following=obj).count()
        except: return 0

    def get_following_count(self, obj):
        try:
            from apps.follows.models import Follow
            return Follow.objects.filter(follower=obj).count()
        except: return 0


class UserPublicSerializer(serializers.ModelSerializer):
    """GET /api/users/:id/ — profil public d'un autre user"""
    full_name       = serializers.SerializerMethodField()   # ✅ AJOUTÉ
    avatar          = serializers.SerializerMethodField()
    cover_image     = serializers.SerializerMethodField()
    bio             = serializers.SerializerMethodField()
    headline        = serializers.SerializerMethodField()
    location        = serializers.SerializerMethodField()
    website         = serializers.SerializerMethodField()
    linkedin        = serializers.SerializerMethodField()
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    posts_count     = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'full_name', 'email', 'role',
            'avatar', 'cover_image', 'bio', 'headline',
            'location', 'website', 'linkedin',
            'followers_count', 'following_count', 'posts_count'
        ]

    def get_full_name(self, obj):   return obj.full_name or obj.username  # ✅

    def get_avatar(self, obj):
        try:
            req = self.context.get('request')
            return build_absolute_url(req, obj.profile.avatar)
        except: return None

    def get_cover_image(self, obj):
        try:
            req = self.context.get('request')
            return build_absolute_url(req, obj.profile.cover_image)
        except: return None

    def get_bio(self, obj):
        try: return obj.profile.bio
        except: return ''

    def get_headline(self, obj):
        try: return obj.profile.headline
        except: return ''

    def get_location(self, obj):
        try: return obj.profile.location
        except: return ''

    def get_website(self, obj):
        try: return obj.profile.website
        except: return ''

    def get_linkedin(self, obj):
        try: return obj.profile.linkedin
        except: return ''

    def get_followers_count(self, obj):
        try:
            from apps.follows.models import Follow
            return Follow.objects.filter(following=obj).count()
        except: return 0

    def get_following_count(self, obj):
        try:
            from apps.follows.models import Follow
            return Follow.objects.filter(follower=obj).count()
        except: return 0

    def get_posts_count(self, obj):
        try: return obj.posts.count()
        except: return 0
