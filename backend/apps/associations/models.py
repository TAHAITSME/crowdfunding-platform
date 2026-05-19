from django.db import models

# Create your models here.
# backend/apps/associations/models.py
import uuid
from django.db import models
from apps.users.models import User


class Association(models.Model):
    STATUS_PENDING = 'pending'
    STATUS_APPROVED = 'approved'
    STATUS_REJECTED = 'rejected'

    STATUS_CHOICES = [
        (STATUS_PENDING, 'En attente'),
        (STATUS_APPROVED, 'Approuvee'),
        (STATUS_REJECTED, 'Rejetee'),
    ]

    REJECTION_FIELD_LABELS = {
        'name': "Nom de l'association",
        'email': 'Email',
        'phone': 'Telephone',
        'bio': 'Bio / description',
        'location': 'Localisation / adresse',
        'document': 'Document PDF',
        'password': 'Mot de passe',
        'other': 'Autre',
    }

    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user        = models.OneToOneField(User, on_delete=models.CASCADE, related_name='association')
    name        = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    logo        = models.ImageField(upload_to='association_logos/', blank=True, null=True)
    document    = models.FileField(upload_to='association_docs/')
    location    = models.CharField(max_length=200, blank=True)
    website     = models.URLField(blank=True)
    facebook    = models.URLField(blank=True)
    instagram   = models.URLField(blank=True)
    moderation_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    is_approved = models.BooleanField(default=False)
    rejection_fields = models.JSONField(default=list, blank=True)
    rejection_reason = models.TextField(blank=True)
    last_rejection_fields = models.JSONField(default=list, blank=True)
    last_rejection_reason = models.TextField(blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_association_requests')
    resubmitted_at = models.DateTimeField(null=True, blank=True)
    total_collected = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'associations'

    def __str__(self):
        return f"{self.name} ({self.get_moderation_status_display()})"
