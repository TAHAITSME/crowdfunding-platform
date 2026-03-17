# backend/apps/donations/views.py
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Donation
from .serializers import DonationSerializer, CreateDonationSerializer
from .services import DonationService
from apps.campaigns.models import Campaign


class MakeDonationView(APIView):
    """Effectuer un don — utilisateur connecté uniquement"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = CreateDonationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            campaign = Campaign.objects.get(pk=serializer.validated_data['campaign_id'])
        except Campaign.DoesNotExist:
            return Response({'error': 'Campagne introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            donation = DonationService.process_donation(
                donor=request.user,
                campaign=campaign,
                amount=serializer.validated_data['amount'],
                is_anonymous=serializer.validated_data['is_anonymous'],
            )
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(DonationSerializer(donation).data, status=status.HTTP_201_CREATED)


class DonationHistoryView(generics.ListAPIView):
    """Historique des dons de l'utilisateur connecté"""
    serializer_class   = DonationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Donation.objects.filter(
            donor=self.request.user,
            status=Donation.COMPLETED
        ).select_related('campaign')
