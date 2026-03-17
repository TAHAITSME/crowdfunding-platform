# backend/apps/campaigns/models.py
import uuid
from django.db import models
from django.utils import timezone
from apps.associations.models import Association


class Campaign(models.Model):
    HEALTH       = 'health'
    EDUCATION    = 'education'
    ENVIRONMENT  = 'environment'
    HUMANITARIAN = 'humanitarian'
    EMERGENCY    = 'emergency'

    CATEGORY_CHOICES = [
        (HEALTH,       'Santé'),
        (EDUCATION,    'Éducation'),
        (ENVIRONMENT,  'Environnement'),
        (HUMANITARIAN, 'Humanitaire'),
        (EMERGENCY,    'Urgence'),
    ]

    id              = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    association     = models.ForeignKey(Association, on_delete=models.CASCADE, related_name='campaigns')
    title           = models.CharField(max_length=300)
    description     = models.TextField()
    goal_amount     = models.DecimalField(max_digits=12, decimal_places=2)
    current_amount  = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    category        = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    deadline        = models.DateTimeField()
    image           = models.ImageField(upload_to='campaigns/', blank=True, null=True)
    is_active       = models.BooleanField(default=True)
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'campaigns'
        ordering = ['-created_at']
        indexes  = [
            models.Index(fields=['category']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return self.title

    @property
    def progress_percentage(self):
        """Calcule le pourcentage de progression 0% → 100%"""
        if self.goal_amount == 0:
            return 0
        return min(round((self.current_amount / self.goal_amount) * 100, 2), 100)

    @property
    def is_completed(self):
        return self.current_amount >= self.goal_amount

    @property
    def is_expired(self):
        return timezone.now() > self.deadline
