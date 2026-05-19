import stripe
from decimal import Decimal

from django.conf import settings
from django.db import transaction
from django.db.models import Sum
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from rest_framework import generics, permissions
from rest_framework.parsers import BaseParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Donation
from .serializers import DonationSerializer
from apps.campaigns.models import Campaign
from apps.campaigns.serializers import CampaignSerializer


stripe.api_key = settings.STRIPE_SECRET_KEY
FRONTEND_URL = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')


class RawBodyParser(BaseParser):
    media_type = '*/*'

    def parse(self, stream, media_type=None, parser_context=None):
        return stream.read()


def recalculate_campaign_amount(campaign):
    total = (
        Donation.objects
        .filter(campaign=campaign, status=Donation.COMPLETED)
        .aggregate(total=Sum('amount'))['total']
        or Decimal('0')
    )
    campaign.current_amount = total
    campaign.save(update_fields=['current_amount', 'updated_at'])
    return campaign


def complete_paid_donation(session_id, payment_intent=''):
    with transaction.atomic():
        donation = (
            Donation.objects
            .select_for_update()
            .select_related('campaign')
            .get(stripe_session_id=session_id)
        )

        if donation.status != Donation.COMPLETED:
            donation.status = Donation.COMPLETED
            donation.stripe_payment_intent = payment_intent or ''
            donation.save(update_fields=['status', 'stripe_payment_intent'])
        elif payment_intent and not donation.stripe_payment_intent:
            donation.stripe_payment_intent = payment_intent
            donation.save(update_fields=['stripe_payment_intent'])

        campaign = recalculate_campaign_amount(donation.campaign)

    return donation, campaign


def sync_paid_pending_donations(campaign=None, donor=None):
    qs = Donation.objects.filter(status=Donation.PENDING).exclude(stripe_session_id='')
    if campaign is not None:
        qs = qs.filter(campaign=campaign)
    if donor is not None:
        qs = qs.filter(donor=donor)

    synced_campaign_ids = set()
    for donation in qs.select_related('campaign'):
        try:
            session = stripe.checkout.Session.retrieve(donation.stripe_session_id)
        except stripe.error.StripeError:
            continue

        if session['payment_status'] == 'paid':
            _, synced_campaign = complete_paid_donation(
                session_id=donation.stripe_session_id,
                payment_intent=session['payment_intent'] or '',
            )
            synced_campaign_ids.add(synced_campaign.id)

    return synced_campaign_ids


class CreateCheckoutSessionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.role == request.user.ROLE_ASSOCIATION:
            return Response(
                {'error': 'Les comptes association ne peuvent pas effectuer de dons.'},
                status=403,
            )

        campaign_id = request.data.get('campaign_id')
        amount = request.data.get('amount')
        is_anonymous = request.data.get('is_anonymous', False)
        message = request.data.get('message', '')

        try:
            campaign = Campaign.objects.get(id=campaign_id, is_active=True)
        except Campaign.DoesNotExist:
            return Response({'error': 'Campagne introuvable.'}, status=404)

        if campaign.is_expired or campaign.is_completed:
            return Response(
                {'error': 'Cette campagne ne peut plus recevoir de dons.'},
                status=400,
            )

        try:
            amount = Decimal(str(amount))
            if amount < Decimal('10'):
                return Response({'error': 'Le montant minimum est 10 MAD.'}, status=400)
        except Exception:
            return Response({'error': 'Montant invalide.'}, status=400)

        donation = Donation.objects.create(
            campaign=campaign,
            donor=request.user,
            amount=amount,
            is_anonymous=is_anonymous,
            message=message,
            status=Donation.PENDING,
        )

        try:
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': 'mad',
                        'unit_amount': int(amount * Decimal('100')),
                        'product_data': {
                            'name': f'Don - {campaign.title}',
                        },
                    },
                    'quantity': 1,
                }],
                mode='payment',
                success_url=(
                    f'{FRONTEND_URL}/campaigns/{campaign.id}'
                    f'?payment=success&session_id={{CHECKOUT_SESSION_ID}}'
                ),
                cancel_url=f'{FRONTEND_URL}/campaigns/{campaign.id}?payment=cancelled',
                metadata={'donation_id': str(donation.id)},
                customer_email=request.user.email,
            )
        except stripe.error.StripeError as e:
            donation.delete()
            return Response({'error': str(e)}, status=400)

        donation.stripe_session_id = session.id
        donation.save(update_fields=['stripe_session_id'])

        return Response({'url': session.url, 'session_id': session.id})


class ConfirmCheckoutSessionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        session_id = request.data.get('session_id')
        if not session_id:
            return Response({'error': 'session_id requis.'}, status=400)

        try:
            Donation.objects.get(stripe_session_id=session_id, donor=request.user)
        except Donation.DoesNotExist:
            return Response({'error': 'Donation introuvable.'}, status=404)

        try:
            session = stripe.checkout.Session.retrieve(session_id)
        except stripe.error.StripeError as e:
            return Response({'error': str(e)}, status=400)

        if session['payment_status'] != 'paid':
            return Response({'error': 'Paiement non confirme par Stripe.'}, status=400)

        donation, campaign = complete_paid_donation(
            session_id=session_id,
            payment_intent=session['payment_intent'] or '',
        )

        return Response({
            'donation': DonationSerializer(donation).data,
            'campaign': CampaignSerializer(campaign, context={'request': request}).data,
        })


class SyncPaidDonationsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        campaign_id = request.data.get('campaign_id')
        campaign = None
        if campaign_id:
            try:
                campaign = Campaign.objects.get(id=campaign_id)
            except Campaign.DoesNotExist:
                return Response({'error': 'Campagne introuvable.'}, status=404)

        synced_campaign_ids = sync_paid_pending_donations(campaign=campaign, donor=request.user)
        campaigns = Campaign.objects.filter(id__in=synced_campaign_ids)

        return Response({
            'synced_campaign_ids': [str(pk) for pk in synced_campaign_ids],
            'campaigns': CampaignSerializer(campaigns, many=True, context={'request': request}).data,
        })


@method_decorator(csrf_exempt, name='dispatch')
class StripeWebhookView(APIView):
    permission_classes = []
    authentication_classes = []
    parser_classes = [RawBodyParser]

    def post(self, request):
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE', '')

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except ValueError:
            return HttpResponse(status=400)
        except stripe.error.SignatureVerificationError:
            return HttpResponse(status=400)

        event_type = event['type']

        if event_type == 'checkout.session.completed':
            self.handle_checkout_completed(event['data']['object'])

        elif event_type == 'checkout.session.expired':
            session_id = event['data']['object']['id']
            Donation.objects.filter(
                stripe_session_id=session_id,
                status=Donation.PENDING,
            ).update(status=Donation.FAILED)

        return HttpResponse(status=200)

    def handle_checkout_completed(self, session):
        session_id = session['id']

        try:
            Donation.objects.only('id').get(stripe_session_id=session_id)
        except Donation.DoesNotExist:
            return

        complete_paid_donation(
            session_id=session_id,
            payment_intent=session['payment_intent'] or '',
        )


class DonationHistoryView(generics.ListAPIView):
    serializer_class = DonationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            Donation.objects
            .filter(donor=self.request.user, status=Donation.COMPLETED)
            .select_related('campaign')
            .order_by('-created_at')
        )
