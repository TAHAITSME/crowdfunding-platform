from django.db import models

# Create your models here.
# backend/apps/users/models.py
import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Modèle User personnalisé.
    On hérite de AbstractUser pour garder tout le système
    d'authentification de Django (password hashing, permissions...).
    On ajoute nos propres champs en plus.
    """

    # Rôles possibles sur la plateforme
    ROLE_USER        = 'user'
    ROLE_ASSOCIATION = 'association'
    ROLE_ADMIN       = 'admin'

    ROLE_CHOICES = [
        (ROLE_USER,        'Utilisateur'),
        (ROLE_ASSOCIATION, 'Association'),
        (ROLE_ADMIN,       'Administrateur'),
    ]

    # UUID comme clé primaire — plus sécurisé que les entiers auto-incrémentés
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # On utilise l'email pour se connecter (pas le username)
    email = models.EmailField(unique=True)

    # Informations personnelles (obligatoires pour faire un don)
    phone  = models.CharField(max_length=20, blank=True)
    cin    = models.CharField(max_length=20, blank=True)  # Confidentiel

    # Profil
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    bio    = models.TextField(blank=True)

    # Rôle sur la plateforme
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_USER)

    # Statut du compte
    is_verified = models.BooleanField(default=False)

    # Préférences
    dark_mode = models.BooleanField(default=False)

    # Anti-spam : limite de publications par jour
    daily_post_count = models.IntegerField(default=0)
    last_post_date   = models.DateField(null=True, blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # On utilise l'email comme identifiant de connexion
    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = ['username']  # Toujours requis par Django

    class Meta:
        db_table = 'users'
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['role']),
        ]

    def __str__(self):
        return f"{self.username} ({self.role})"

    # ── Helpers pratiques ──────────────────────────────────
    @property
    def is_association(self):
        return self.role == self.ROLE_ASSOCIATION

    @property
    def is_regular_user(self):
        return self.role == self.ROLE_USER
