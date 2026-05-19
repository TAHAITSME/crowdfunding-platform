# backend/apps/users/models.py
import uuid
from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_USER = 'user'
    ROLE_ASSOCIATION = 'association'
    ROLE_ADMIN = 'admin'

    ROLE_CHOICES = [
        (ROLE_USER, 'Utilisateur'),
        (ROLE_ASSOCIATION, 'Association'),
        (ROLE_ADMIN, 'Administrateur'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True)
    cin = models.CharField(max_length=20, blank=True, null=True, unique=True)
    full_name = models.CharField(max_length=150, blank=True)
    document = models.FileField(upload_to='associations/documents/', blank=True, null=True)

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_USER)
    is_verified = models.BooleanField(default=False)
    dark_mode = models.BooleanField(default=False)

    daily_post_count = models.IntegerField(default=0)
    last_post_date = models.DateField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        db_table = 'users'
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['role']),
        ]

    def __str__(self):
        return f"{self.username} ({self.role})"

    @property
    def is_association(self):
        return self.role == self.ROLE_ASSOCIATION

    @property
    def is_regular_user(self):
        return self.role == self.ROLE_USER


class Profile(models.Model):
    PUBLIC = 'public'
    PRIVATE = 'private'

    PRIVACY_CHOICES = [
        (PUBLIC, 'Public'),
        (PRIVATE, 'Prive'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')

    avatar = models.ImageField(upload_to='profiles/avatars/', blank=True, null=True)
    cover_image = models.ImageField(upload_to='profiles/covers/', blank=True, null=True)

    headline = models.CharField(max_length=120, blank=True)
    bio = models.TextField(blank=True)
    location = models.CharField(max_length=120, blank=True)

    website = models.URLField(blank=True)
    linkedin = models.URLField(blank=True)

    privacy = models.CharField(max_length=10, choices=PRIVACY_CHOICES, default=PUBLIC)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'profiles'

    def __str__(self):
        return f"Profile of {self.user.username}"
