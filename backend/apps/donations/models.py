# backend/apps/donations/models.py
import uuid
from django.db import models
from apps.users.models import User
from apps.campaigns.models import Campaign


class Donation(models.Model):
    PENDING   = 'pending'
    COMPLETED = 'completed'
    FAILED    = 'failed'
    REFUNDED  = 'refunded'

    STATUS_CHOICES = [
        (PENDING,   'En attente'),
        (COMPLETED, 'Complété'),
        (FAILED,    'Échoué'),
        (REFUNDED,  'Remboursé'),
    ]

    id                = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    donor             = models.ForeignKey(User, on_delete=models.RESTRICT, related_name='donations')
    campaign          = models.ForeignKey(Campaign, on_delete=models.RESTRICT, related_name='donations')
    amount            = models.DecimalField(max_digits=10, decimal_places=2)
    commission_amount = models.DecimalField(max_digits=10, decimal_places=2)  # 5%
    net_amount        = models.DecimalField(max_digits=10, decimal_places=2)  # 95%
    status            = models.CharField(max_length=20, choices=STATUS_CHOICES, default=COMPLETED)
    transaction_id    = models.CharField(max_length=200, unique=True)
    is_anonymous      = models.BooleanField(default=False)
    created_at        = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'donations'
        ordering = ['-created_at']
        indexes  = [
            models.Index(fields=['donor', 'status']),
            models.Index(fields=['campaign', 'status']),
        ]

    def __str__(self):
        return f"{self.donor.username} → {self.campaign.title} ({self.amount} MAD)"
