from django.db import models
from django.conf import settings
from decimal import Decimal
from apps.campaigns.models import Campaign


class Donation(models.Model):
    PENDING = 'pending'
    COMPLETED = 'completed'
    FAILED = 'failed'

    campaign          = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name='donations')
    donor             = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    amount            = models.DecimalField(max_digits=10, decimal_places=2)
    commission_rate   = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('5.00'))
    commission_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    net_amount        = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    is_anonymous      = models.BooleanField(default=False)
    message           = models.TextField(blank=True)

    # Stripe
    stripe_session_id     = models.CharField(max_length=255, blank=True)
    stripe_payment_intent = models.CharField(max_length=255, blank=True)
    status = models.CharField(
        max_length=20,
        choices=[(PENDING, 'Pending'), (COMPLETED, 'Completed'), (FAILED, 'Failed')],
        default=PENDING
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # ✅ Tout en Decimal — pas de float
        self.commission_amount = round(
            self.amount * self.commission_rate / Decimal('100'), 2
        )
        self.net_amount = round(
            self.amount - self.commission_amount, 2
        )
        super().save(*args, **kwargs)

    @property
    def donor_name(self):
        if self.is_anonymous:
            return 'Anonyme'
        return self.donor.get_full_name() or self.donor.username if self.donor else 'Anonyme'

    def __str__(self):
        return f"{self.donor_name} → {self.campaign.title} ({self.amount} MAD)"
