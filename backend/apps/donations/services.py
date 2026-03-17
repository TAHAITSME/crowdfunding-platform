# backend/apps/donations/services.py
import uuid
from decimal import Decimal
from django.db.models import F
from .models import Donation
from apps.campaigns.models import Campaign


class DonationService:
    """
    Toute la logique métier des dons est ici.
    Séparée des views pour être testable indépendamment.
    """
    COMMISSION_RATE = Decimal('0.05')  # 5%

    @classmethod
    def process_donation(cls, donor, campaign, amount, is_anonymous=False):

        # Vérifications
        if not campaign.is_active:
            raise ValueError("Cette campagne n'est plus active.")

        if campaign.is_expired:
            raise ValueError("Cette campagne a expiré.")

        if campaign.is_completed:
            raise ValueError("Cette campagne a déjà atteint son objectif.")

        if amount <= 0:
            raise ValueError("Le montant du don doit être positif.")

        # Calcul commission
        amount           = Decimal(str(amount))
        commission       = round(amount * cls.COMMISSION_RATE, 2)
        net              = amount - commission

        # Créer le don
        donation = Donation.objects.create(
            donor=donor,
            campaign=campaign,
            amount=amount,
            commission_amount=commission,
            net_amount=net,
            status=Donation.COMPLETED,
            transaction_id=str(uuid.uuid4()),
            is_anonymous=is_anonymous,
        )

        # Mettre à jour le montant collecté de la campagne
        # F() évite les race conditions en cas de dons simultanés
        Campaign.objects.filter(pk=campaign.pk).update(
            current_amount=F('current_amount') + net
        )

        return donation
