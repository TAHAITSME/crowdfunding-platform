from django.db import IntegrityError
from django.db.models import Q
from django.utils.text import slugify
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, Profile

def get_accepted_friend_ids(user):
    from apps.friendships.models import Friendship

    if not user or not getattr(user, 'id', None):
        return set()

    friendships = Friendship.objects.filter(
        status=Friendship.ACCEPTED,
    ).filter(
        Q(requester=user) | Q(addressee=user)
    ).values_list('requester_id', 'addressee_id')

    friend_ids = set()
    for requester_id, addressee_id in friendships:
        friend_ids.add(addressee_id if requester_id == user.id else requester_id)
    return friend_ids


def get_mutual_friends_data(request_user, target_user, limit=3):
    if not request_user or not getattr(request_user, 'is_authenticated', False):
        return 0, []
    if not target_user or request_user.id == target_user.id:
        return 0, []

    current_friend_ids = get_accepted_friend_ids(request_user)
    target_friend_ids = get_accepted_friend_ids(target_user)
    mutual_ids = list(current_friend_ids.intersection(target_friend_ids))

    if not mutual_ids:
        return 0, []

    users = (
        User.objects.select_related('profile')
        .filter(id__in=mutual_ids)
        .order_by('full_name', 'username')[:limit]
    )
    preview = []
    for user in users:
        preview.append({
            'id': str(user.id),
            'username': user.username,
            'full_name': user.full_name or user.username,
            'avatar': build_absolute_url(None, user.profile.avatar) if getattr(user, 'profile', None) and user.profile.avatar else None,
        })

    return len(mutual_ids), preview


class RegisterSerializer(serializers.ModelSerializer):
    username = serializers.CharField(write_only=True, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, min_length=6)
    account_type = serializers.CharField(write_only=True, required=False)
    name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    social_links = serializers.CharField(write_only=True, required=False, allow_blank=True)
    cin = serializers.CharField(write_only=True, required=False, allow_blank=True, allow_null=True)
    location = serializers.CharField(write_only=True, required=False, allow_blank=True)
    bio = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            'username', 'email', 'password',
            'phone', 'cin', 'full_name',
            'location', 'bio', 'name', 'social_links',
            'account_type', 'document'
        ]
        extra_kwargs = {
            'username': {'required': False},
            'cin': {'required': False},
            'phone': {'required': False},
            'full_name': {'required': False},
            'location': {'required': False},
            'bio': {'required': False},
            'document': {'required': False},
        }

    def _build_association_username(self, label, email=''):
        base = slugify(label or '') or slugify((email or '').split('@')[0]) or 'association'
        base = base.replace('-', '_')[:24].strip('_') or 'association'
        candidate = base
        suffix = 1
        while User.objects.filter(username=candidate).exists():
            suffix_str = f'_{suffix}'
            candidate = f'{base[: max(1, 30 - len(suffix_str))]}{suffix_str}'
            suffix += 1
        return candidate

    def validate(self, attrs):
        account_type = (attrs.get('account_type') or User.ROLE_USER).strip().lower()
        username = attrs.get('username')
        username = username.strip() if isinstance(username, str) else username
        name = attrs.get('name')
        name = name.strip() if isinstance(name, str) else name
        full_name = attrs.get('full_name')
        full_name = full_name.strip() if isinstance(full_name, str) else full_name
        cin = attrs.get('cin')
        cin = cin.strip() if isinstance(cin, str) else cin
        cin = cin or None

        attrs['account_type'] = account_type
        attrs['username'] = username or ''
        attrs['name'] = name or ''
        attrs['full_name'] = full_name or name or ''
        attrs['cin'] = cin

        if account_type not in {User.ROLE_USER, User.ROLE_ASSOCIATION}:
            raise serializers.ValidationError({'account_type': 'Type de compte invalide.'})

        if account_type == User.ROLE_USER and not username:
            raise serializers.ValidationError({'username': "Le nom d'utilisateur est obligatoire."})

        if account_type == User.ROLE_USER and not cin:
            raise serializers.ValidationError({'cin': 'Le CIN est obligatoire pour un compte utilisateur.'})

        if account_type == User.ROLE_ASSOCIATION:
            label = attrs['name'] or attrs['full_name'] or attrs.get('email', '')
            attrs['username'] = self._build_association_username(label, attrs.get('email', ''))

        if cin and User.objects.filter(cin=cin).exists():
            raise serializers.ValidationError({'cin': 'Ce CIN est deja utilise.'})

        return attrs

    def create(self, validated_data):
        account_type = validated_data.pop('account_type', User.ROLE_USER)
        password = validated_data.pop('password')
        role = User.ROLE_ASSOCIATION if account_type == 'association' else User.ROLE_USER

        association_name = validated_data.pop('name', '') or validated_data.get('full_name') or validated_data.get('username')
        validated_data.pop('social_links', None)
        location = validated_data.pop('location', '')
        bio = validated_data.pop('bio', '')

        validated_data['cin'] = validated_data.get('cin') or None

        if role == User.ROLE_ASSOCIATION and not validated_data.get('document'):
            raise serializers.ValidationError({'document': 'Un document PDF est obligatoire pour une association.'})

        user = User(**validated_data)
        user.set_password(password)
        user.role = role
        if role == User.ROLE_ASSOCIATION:
            user.is_verified = False
        try:
            user.save()
        except IntegrityError as exc:
            error_message = str(exc).lower()
            if 'cin' in error_message:
                if 'cannot be null' in error_message:
                    raise serializers.ValidationError({
                        'cin': 'La base de donnees attend encore un CIN obligatoire. Appliquez la migration users.0004.'
                    }) from exc
                if 'duplicate entry' in error_message:
                    raise serializers.ValidationError({'cin': 'Ce CIN est deja utilise.'}) from exc
            raise

        Profile.objects.get_or_create(user=user)

        if role == User.ROLE_ASSOCIATION:
            from apps.associations.models import Association

            Association.objects.get_or_create(
                user=user,
                defaults={
                    'name': association_name,
                    'description': bio,
                    'document': user.document,
                    'location': location,
                    'moderation_status': Association.STATUS_PENDING,
                    'is_approved': False,
                }
            )

        return user


class LoginSerializer(TokenObtainPairSerializer):
    username_field = User.EMAIL_FIELD

    def validate(self, attrs):
        login_value = (attrs.get('email') or attrs.get('username') or '').strip()

        if not login_value:
            raise serializers.ValidationError({'email': 'Email ou nom d utilisateur obligatoire.'})

        if '@' not in login_value:
            try:
                matched_user = User.objects.get(username=login_value)
            except User.DoesNotExist:
                matched_user = None
            if matched_user:
                attrs['email'] = matched_user.email
        else:
            attrs['email'] = login_value

        return super().validate(attrs)


class UserSerializer(serializers.ModelSerializer):
    association_status = serializers.SerializerMethodField()
    association_status_label = serializers.SerializerMethodField()
    association_rejection_fields = serializers.SerializerMethodField()
    association_rejection_field_labels = serializers.SerializerMethodField()
    association_rejection_reason = serializers.SerializerMethodField()
    association_resubmitted_at = serializers.SerializerMethodField()
    association_reviewed_at = serializers.SerializerMethodField()
    association_reviewed_by_name = serializers.SerializerMethodField()
    association_was_resubmitted = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'phone', 'cin', 'full_name',
            'role', 'is_verified', 'is_active', 'is_staff', 'is_superuser',
            'dark_mode', 'date_joined', 'created_at',
            'association_status', 'association_status_label',
            'association_rejection_fields', 'association_rejection_field_labels',
            'association_rejection_reason', 'association_resubmitted_at',
            'association_reviewed_at', 'association_reviewed_by_name',
            'association_was_resubmitted',
        ]
        read_only_fields = [
            'id', 'created_at', 'date_joined', 'role', 'is_verified',
            'is_active', 'is_staff', 'is_superuser',
        ]

    def _get_association(self, obj):
        if obj.role != User.ROLE_ASSOCIATION:
            return None
        try:
            return obj.association
        except Exception:
            return None

    def get_association_status(self, obj):
        association = self._get_association(obj)
        return association.moderation_status if association else None

    def get_association_status_label(self, obj):
        association = self._get_association(obj)
        return association.get_moderation_status_display() if association else None

    def get_association_rejection_fields(self, obj):
        association = self._get_association(obj)
        if not association:
            return []
        return list(association.rejection_fields or association.last_rejection_fields or [])

    def get_association_rejection_field_labels(self, obj):
        association = self._get_association(obj)
        if not association:
            return []
        from apps.associations.models import Association
        fields = self.get_association_rejection_fields(obj)
        return [Association.REJECTION_FIELD_LABELS.get(item, item) for item in fields]

    def get_association_rejection_reason(self, obj):
        association = self._get_association(obj)
        if not association:
            return ''
        return association.rejection_reason or association.last_rejection_reason or ''

    def get_association_resubmitted_at(self, obj):
        association = self._get_association(obj)
        return association.resubmitted_at if association else None

    def get_association_reviewed_at(self, obj):
        association = self._get_association(obj)
        return association.reviewed_at if association else None

    def get_association_reviewed_by_name(self, obj):
        association = self._get_association(obj)
        if not association or not association.reviewed_by:
            return None
        return association.reviewed_by.full_name or association.reviewed_by.username or association.reviewed_by.email

    def get_association_was_resubmitted(self, obj):
        association = self._get_association(obj)
        return bool(association and association.resubmitted_at)


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
    return f'/media/{path_str}'


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
    liked_posts_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    donations_count = serializers.SerializerMethodField()
    followed_associations_count = serializers.SerializerMethodField()

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

    def get_liked_posts_count(self, obj):
        try: return obj.likes.count()
        except: return 0

    def get_comments_count(self, obj):
        try: return obj.comments.count()
        except: return 0

    def get_donations_count(self, obj):
        try:
            from apps.donations.models import Donation
            return Donation.objects.filter(donor=obj, status=Donation.COMPLETED).count()
        except: return 0

    def get_followed_associations_count(self, obj):
        try:
            from apps.follows.models import Follow
            return Follow.objects.filter(follower=obj, following__role=User.ROLE_ASSOCIATION).count()
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
    liked_posts_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    donations_count = serializers.SerializerMethodField()
    followed_associations_count = serializers.SerializerMethodField()
    mutual_friends_count = serializers.SerializerMethodField()
    mutual_friends_preview = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'full_name', 'email', 'role',
            'avatar', 'cover_image', 'bio', 'headline',
            'location', 'website', 'linkedin',
            'followers_count', 'following_count', 'posts_count',
            'liked_posts_count', 'comments_count', 'donations_count',
            'followed_associations_count',
            'mutual_friends_count', 'mutual_friends_preview'
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

    def get_liked_posts_count(self, obj):
        try: return obj.likes.count()
        except: return 0

    def get_comments_count(self, obj):
        try: return obj.comments.count()
        except: return 0

    def get_donations_count(self, obj):
        try:
            from apps.donations.models import Donation
            return Donation.objects.filter(donor=obj, status=Donation.COMPLETED).count()
        except: return 0

    def get_followed_associations_count(self, obj):
        try:
            from apps.follows.models import Follow
            return Follow.objects.filter(follower=obj, following__role=User.ROLE_ASSOCIATION).count()
        except: return 0

    def get_mutual_friends_count(self, obj):
        count, _ = get_mutual_friends_data(self.context.get('request').user, obj)
        return count

    def get_mutual_friends_preview(self, obj):
        _, preview = get_mutual_friends_data(self.context.get('request').user, obj)
        return preview
