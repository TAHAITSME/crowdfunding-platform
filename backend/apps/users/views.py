# backend/apps/users/views.py
from django.shortcuts import get_object_or_404
from django.contrib.auth import update_session_auth_hash
from django.contrib.auth.hashers import check_password
from django.db.models import Sum

from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.associations.models import Association
from apps.associations.serializers import AssociationSerializer
from apps.campaigns.models import Campaign
from apps.campaigns.serializers import CampaignSerializer
from apps.donations.models import Donation
from apps.donations.serializers import DonationSerializer

from .models import User, Profile
from .serializers import (
    RegisterSerializer,
    UserSerializer,
    ProfileSerializer,
    MeProfileDetailSerializer,
    UserPublicSerializer,
)


class RegisterView(generics.CreateAPIView):
    serializer_class   = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class UserPublicProfileView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    queryset           = User.objects.select_related('profile').all()
    serializer_class   = UserPublicSerializer
    lookup_field       = 'id'

    def get_serializer_context(self):
        return {'request': self.request}


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class   = UserSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_object(self):
        pk = self.kwargs.get("pk", self.request.user.id)
        return get_object_or_404(User, pk=pk)


class MeView(generics.RetrieveAPIView):
    serializer_class   = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class MeProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def retrieve(self, request, *args, **kwargs):
        user = request.user
        Profile.objects.get_or_create(user=user)
        serializer = MeProfileDetailSerializer(user, context={'request': request})
        return Response(serializer.data)

    def update(self, request, *args, **kwargs):
        user = request.user
        profile, _ = Profile.objects.get_or_create(user=user)
        serializer = ProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            detail = MeProfileDetailSerializer(user, context={'request': request})
            return Response(detail.data)
        return Response(serializer.errors, status=400)


class UpdateProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        user    = request.user
        profile = user.profile
        data    = request.data

        if 'username' in data and data['username']:
            new_username = data['username'].strip()
            if new_username != user.username:
                if User.objects.filter(username=new_username).exclude(pk=user.pk).exists():
                    return Response({'error': 'Cet identifiant est déjà pris'}, status=400)
                user.username = new_username

        full_name = data.get('full_name', '')
        if full_name:
            parts = full_name.strip().split(' ', 1)
            user.first_name = parts[0]
            user.last_name  = parts[1] if len(parts) > 1 else ''
            user.full_name  = full_name

        for field in ['bio', 'headline', 'location', 'website', 'linkedin']:
            if field in data:
                setattr(profile, field, data[field])

        if 'avatar' in request.FILES:
            profile.avatar = request.FILES['avatar']

        if 'cover_image' in request.FILES:
            profile.cover_image = request.FILES['cover_image']

        user.save()
        profile.save()
        return Response(MeProfileDetailSerializer(user, context={'request': request}).data)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user         = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')

        if not check_password(old_password, user.password):
            return Response({'error': 'Mot de passe actuel incorrect'}, status=400)
        if not new_password or len(new_password) < 8:
            return Response({'error': 'Minimum 8 caractères'}, status=400)

        user.set_password(new_password)
        user.save()
        update_session_auth_hash(request, user)
        return Response({'success': True})


class TogglePrivacyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user       = request.user
        password   = request.data.get('password')
        is_private = request.data.get('is_private')

        if not check_password(password, user.password):
            return Response({'error': 'Mot de passe incorrect'}, status=400)

        profile            = user.profile
        profile.is_private = is_private
        profile.save()
        return Response({'success': True, 'is_private': profile.is_private})


class SearchView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        q = request.query_params.get('q', '').strip()
        if len(q) < 2:
            return Response({'users': [], 'associations': []})

        users = User.objects.filter(
            username__icontains=q
        ).exclude(id=request.user.id)[:5]

        associations = Association.objects.filter(
            name__icontains=q, is_approved=True
        )[:5]

        return Response({
            'users':        UserSerializer(users, many=True).data,
            'associations': AssociationSerializer(associations, many=True).data,
        })


# ═══════════════════════════════════════════════
# 👑 ADMIN VIEWS
# ═══════════════════════════════════════════════

class AdminStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_staff:
            return Response({'error': 'Accès refusé'}, status=403)

        return Response({
            'total_users':            User.objects.count(),
            'total_associations':     Association.objects.count(),
            'pending_associations':   Association.objects.filter(is_approved=False).count(),
            'total_campaigns':        Campaign.objects.count(),
            'active_campaigns':       Campaign.objects.filter(is_active=True).count(),
            'total_donations':        Donation.objects.filter(status=Donation.COMPLETED).count(),
            'total_raised':           Donation.objects.filter(status=Donation.COMPLETED)
                                        .aggregate(t=Sum('amount'))['t'] or 0,
            'total_commission':       Donation.objects.filter(status=Donation.COMPLETED)
                                        .aggregate(t=Sum('commission_amount'))['t'] or 0,
        })


class AdminUsersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_staff:
            return Response({'error': 'Accès refusé'}, status=403)
        users = User.objects.all().order_by('-date_joined')
        return Response(UserSerializer(users, many=True).data)


class AdminToggleUserView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if not request.user.is_staff:
            return Response({'error': 'Accès refusé'}, status=403)
        user = get_object_or_404(User, pk=pk)
        user.is_active = not user.is_active
        user.save()
        return Response({'is_active': user.is_active})


class AdminAssociationsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_staff:
            return Response({'error': 'Accès refusé'}, status=403)
        associations = Association.objects.all().order_by('-created_at')
        return Response(AssociationSerializer(associations, many=True).data)


class RejectAssociationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if not request.user.is_staff:
            return Response({'error': 'Accès refusé'}, status=403)
        association = get_object_or_404(Association, pk=pk)
        association.is_approved = False
        association.save()
        return Response({'message': f"Association '{association.name}' rejetée."})


class AdminCampaignsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_staff:
            return Response({'error': 'Accès refusé'}, status=403)
        campaigns = Campaign.objects.all().order_by('-created_at')
        return Response(CampaignSerializer(campaigns, many=True).data)


class AdminToggleCampaignView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if not request.user.is_staff:
            return Response({'error': 'Accès refusé'}, status=403)
        campaign = get_object_or_404(Campaign, pk=pk)
        campaign.is_active = not campaign.is_active
        campaign.save()
        return Response({'is_active': campaign.is_active})


class AdminDonationsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_staff:
            return Response({'error': 'Accès refusé'}, status=403)
        donations = Donation.objects.all().order_by('-created_at')
        return Response(DonationSerializer(donations, many=True).data)