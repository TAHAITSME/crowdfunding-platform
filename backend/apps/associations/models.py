from django.db import models

# Create your models here.
# backend/apps/associations/models.py
import uuid
from django.db import models
from apps.users.models import User


class Association(models.Model):
    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user        = models.OneToOneField(User, on_delete=models.CASCADE, related_name='association')
    name        = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    logo        = models.ImageField(upload_to='association_logos/', blank=True, null=True)
    document    = models.FileField(upload_to='association_docs/')  # PDF officiel
    location    = models.CharField(max_length=200, blank=True)
    website     = models.URLField(blank=True)
    facebook    = models.URLField(blank=True)
    instagram   = models.URLField(blank=True)
    is_approved = models.BooleanField(default=False)  # Validé par l'admin
    total_collected = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'associations'

    def __str__(self):
        return f"{self.name} ({'Approuvée' if self.is_approved else 'En attente'})"
