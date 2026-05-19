# backend/apps/users/views.py
import csv

from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.contrib.auth import update_session_auth_hash
from django.contrib.auth.hashers import check_password
from django.db.models import F, Q, Sum
from django.utils import timezone

from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework_simplejwt.views import TokenObtainPairView

from apps.associations.models import Association
from apps.associations.serializers import AssociationSerializer
from apps.campaigns.models import Campaign
from apps.campaigns.serializers import CampaignSerializer
from apps.comments.models import Comment
from apps.donations.models import Donation
from apps.donations.serializers import DonationSerializer
from apps.posts.models import Post

from .models import User, Profile
from .serializers import (
    RegisterSerializer,
    UserSerializer,
    ProfileSerializer,
    MeProfileDetailSerializer,
    LoginSerializer,
    UserPublicSerializer,
    get_mutual_friends_data,
)


class RegisterView(generics.CreateAPIView):
    serializer_class   = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class LoginView(TokenObtainPairView):
    serializer_class = LoginSerializer


class UserPublicProfileView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    queryset           = User.objects.select_related('profile').all()
    serializer_class   = UserPublicSerializer
    lookup_field       = 'id'

    def get_serializer_context(self):
        return {'request': self.request}


class MutualFriendsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, user_id):
        target_user = get_object_or_404(User.objects.select_related('profile'), id=user_id)
        count, preview = get_mutual_friends_data(request.user, target_user, limit=5)
        return Response({
            'count': count,
            'users': preview,
        })


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
    permission_classes = [IsAdminUser]

    def get(self, request):
        completed = Donation.objects.filter(status=Donation.COMPLETED)
        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        monthly_totals = {}
        for donation in completed.only('amount', 'created_at'):
            key = donation.created_at.strftime('%Y-%m')
            monthly_totals[key] = monthly_totals.get(key, 0) + donation.amount
        monthly_donations = [
            {'month': month, 'total': total}
            for month, total in sorted(monthly_totals.items())
        ]

        category_labels = dict(Campaign.CATEGORY_CHOICES)
        donations_by_category = [
            {
                'name': category_labels.get(item['campaign__category'], item['campaign__category'] or 'Autre'),
                'value': item['total'] or 0,
            }
            for item in completed
            .values('campaign__category')
            .annotate(total=Sum('amount'))
            .order_by('-total')
        ]

        top_campaigns = [
            {
                'id': str(c.id),
                'title': c.title,
                'current_amount': c.current_amount,
                'goal_amount': c.goal_amount,
                'association_name': c.association.name,
            }
            for c in Campaign.objects.select_related('association').order_by('-current_amount')[:5]
        ]

        latest_donations = DonationSerializer(
            Donation.objects.select_related('donor', 'campaign').order_by('-created_at')[:8],
            many=True,
        ).data
        latest_posts = [
            {
                'id': str(post.id),
                'author_name': post.author.full_name or post.author.username,
                'author_id': str(post.author_id),
                'content': post.content,
                'created_at': post.created_at,
                'comments_count': post.comments.filter(is_visible=True).count(),
                'likes_count': post.likes.count(),
            }
            for post in Post.objects.select_related('author').filter(is_visible=True).order_by('-created_at')[:6]
        ]
        latest_comments = [
            {
                'id': str(comment.id),
                'author_name': comment.author.full_name or comment.author.username,
                'author_id': str(comment.author_id),
                'post_id': str(comment.post_id),
                'content': comment.content,
                'created_at': comment.created_at,
            }
            for comment in Comment.objects.select_related('author', 'post').filter(is_visible=True).order_by('-created_at')[:8]
        ]

        campaign_status = {
            'active': Campaign.objects.filter(status=Campaign.STATUS_APPROVED, is_active=True).count(),
            'completed': Campaign.objects.filter(
                Q(current_amount__gte=F('goal_amount')) | Q(deadline__lt=now)
            ).count(),
            'pending': Campaign.objects.filter(status=Campaign.STATUS_PENDING).count(),
            'rejected': Campaign.objects.filter(status=Campaign.STATUS_REJECTED).count(),
            'suspended': Campaign.objects.filter(status=Campaign.STATUS_SUSPENDED).count(),
        }
        pending_campaigns = campaign_status['pending']
        pending_associations = Association.objects.filter(
            moderation_status=Association.STATUS_PENDING
        ).count()
        failed_payments = Donation.objects.filter(status=Donation.FAILED).count()
        review_queue = pending_campaigns + pending_associations
        suspicious_volume = Donation.objects.filter(
            status=Donation.COMPLETED,
            amount__gte=5000,
            created_at__gte=now - timezone.timedelta(days=7),
        ).count()

        return Response({
            'total_users':            User.objects.exclude(role=User.ROLE_ASSOCIATION).count(),
            'total_associations':     Association.objects.count(),
            'pending_associations':   pending_associations,
            'approved_associations':  Association.objects.filter(moderation_status=Association.STATUS_APPROVED).count(),
            'rejected_associations':  Association.objects.filter(moderation_status=Association.STATUS_REJECTED).count(),
            'total_campaigns':        Campaign.objects.count(),
            'active_campaigns':       campaign_status['active'],
            'total_donations':        completed.count(),
            'donations_this_month':   completed.filter(created_at__gte=month_start).count(),
            'total_raised':           completed.aggregate(t=Sum('amount'))['t'] or 0,
            'total_commission':       completed.aggregate(t=Sum('commission_amount'))['t'] or 0,
            'monthly_donations':      monthly_donations,
            'donations_by_category':  donations_by_category,
            'campaign_status':        campaign_status,
            'top_campaigns':          top_campaigns,
            'latest_donations':       latest_donations,
            'latest_posts':           latest_posts,
            'latest_comments':        latest_comments,
            'reports':                [],
            'review_queue':           review_queue,
            'failed_payments':        failed_payments,
            'suspicious_volume':      suspicious_volume,
            'platform_health': {
                'pending_campaigns': pending_campaigns,
                'pending_associations': pending_associations,
                'failed_payments': failed_payments,
                'suspicious_volume': suspicious_volume,
            },
        })


class AdminUsersView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        users = User.objects.exclude(role=User.ROLE_ASSOCIATION).order_by('-date_joined')
        return Response(UserSerializer(users, many=True).data)


class AdminUserDetailView(APIView):
    permission_classes = [IsAdminUser]

    def delete(self, request, pk):
        user = get_object_or_404(User.objects.exclude(role=User.ROLE_ASSOCIATION), pk=pk)
        if user.pk == request.user.pk or user.is_superuser:
            return Response({'error': 'Ce compte administrateur ne peut pas etre supprime.'}, status=400)
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminToggleUserView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        user = get_object_or_404(User.objects.exclude(role=User.ROLE_ASSOCIATION), pk=pk)
        if user.pk == request.user.pk or user.is_superuser:
            return Response({'error': 'Ce compte administrateur ne peut pas etre suspendu.'}, status=400)
        user.is_active = not user.is_active
        user.save(update_fields=['is_active'])
        return Response(UserSerializer(user).data)


class AdminAssociationsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        associations = Association.objects.select_related('user').all().order_by('-created_at')
        return Response(AssociationSerializer(associations, many=True, context={'request': request}).data)


class AdminAssociationActionView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk, action):
        association = get_object_or_404(Association, pk=pk)
        if action == 'approve':
            association.moderation_status = Association.STATUS_APPROVED
            association.is_approved = True
            association.rejection_fields = []
            association.rejection_reason = ''
            association.reviewed_at = timezone.now()
            association.reviewed_by = request.user
            association.user.is_verified = True
            association.user.save(update_fields=['is_verified'])
        elif action == 'reject':
            rejection_fields = request.data.get('rejection_fields') or []
            rejection_reason = (request.data.get('rejection_reason') or '').strip()
            allowed_fields = set(Association.REJECTION_FIELD_LABELS.keys())
            normalized_fields = []
            for item in rejection_fields:
                key = str(item).strip().lower()
                if key and key in allowed_fields and key not in normalized_fields:
                    normalized_fields.append(key)
            if not normalized_fields:
                return Response({'rejection_fields': ['Selectionnez au moins un champ a corriger.']}, status=400)
            if not rejection_reason:
                return Response({'rejection_reason': ['Le motif detaille du rejet est obligatoire.']}, status=400)
            association.moderation_status = Association.STATUS_REJECTED
            association.is_approved = False
            association.rejection_fields = normalized_fields
            association.rejection_reason = rejection_reason
            association.last_rejection_fields = normalized_fields
            association.last_rejection_reason = rejection_reason
            association.reviewed_at = timezone.now()
            association.reviewed_by = request.user
            association.user.is_verified = False
            association.user.save(update_fields=['is_verified'])
        else:
            return Response({'error': 'Action inconnue.'}, status=400)
        association.save(update_fields=[
            'moderation_status', 'is_approved',
            'rejection_fields', 'rejection_reason',
            'last_rejection_fields', 'last_rejection_reason',
            'reviewed_at', 'reviewed_by',
        ])
        return Response(AssociationSerializer(association, context={'request': request}).data)


class AdminCampaignsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        campaigns = Campaign.objects.select_related('association').all().order_by('-created_at')
        return Response(CampaignSerializer(campaigns, many=True).data)


class AdminCampaignActionView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk, action):
        campaign = get_object_or_404(Campaign, pk=pk)
        if action == 'approve':
            campaign.status = Campaign.STATUS_APPROVED
            campaign.is_active = True
        elif action == 'reject':
            campaign.status = Campaign.STATUS_REJECTED
            campaign.is_active = False
        elif action == 'suspend':
            campaign.status = Campaign.STATUS_SUSPENDED
            campaign.is_active = False
        else:
            return Response({'error': 'Action inconnue.'}, status=400)
        campaign.save(update_fields=['status', 'is_active'])
        return Response(CampaignSerializer(campaign).data)


class AdminCampaignDonationsOverTimeView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, pk):
        campaign = get_object_or_404(Campaign, pk=pk)
        monthly_totals = {}
        for donation in Donation.objects.filter(campaign=campaign, status=Donation.COMPLETED).only('amount', 'created_at'):
            key = donation.created_at.strftime('%Y-%m')
            monthly_totals[key] = monthly_totals.get(key, 0) + donation.amount
        return Response([
            {'date': month, 'amount': total}
            for month, total in sorted(monthly_totals.items())
        ])


class AdminDonationsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        donations = Donation.objects.select_related('donor', 'campaign', 'campaign__association').all().order_by('-created_at')
        return Response(DonationSerializer(donations, many=True).data)


class AdminPostsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        posts = (
            Post.objects.select_related('author')
            .filter(is_visible=True)
            .order_by('-created_at')[:50]
        )
        return Response([
            {
                'id': str(post.id),
                'author_name': post.author.full_name or post.author.username,
                'author_id': str(post.author_id),
                'content': post.content,
                'created_at': post.created_at,
                'likes_count': post.likes.count(),
                'comments_count': post.comments.filter(is_visible=True).count(),
            }
            for post in posts
        ])


class AdminPostDetailView(APIView):
    permission_classes = [IsAdminUser]

    def delete(self, request, pk):
        post = get_object_or_404(Post, pk=pk)
        post.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminCommentsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        comments = (
            Comment.objects.select_related('author', 'post')
            .filter(is_visible=True)
            .order_by('-created_at')[:80]
        )
        return Response([
            {
                'id': str(comment.id),
                'author_name': comment.author.full_name or comment.author.username,
                'author_id': str(comment.author_id),
                'post_id': str(comment.post_id),
                'content': comment.content,
                'created_at': comment.created_at,
            }
            for comment in comments
        ])


class AdminCommentDetailView(APIView):
    permission_classes = [IsAdminUser]

    def delete(self, request, pk):
        comment = get_object_or_404(Comment, pk=pk)
        comment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminAlertsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        now = timezone.now()
        alerts = []

        pending_associations = Association.objects.filter(
            moderation_status=Association.STATUS_PENDING
        ).count()
        if pending_associations:
            alerts.append({
                'id': 'pending-associations',
                'severity': 'high',
                'title': 'Associations en attente de verification',
                'message': f'{pending_associations} association(s) doivent etre validees ou rejetees.',
                'target': '/admin/associations',
            })

        pending_campaigns = Campaign.objects.filter(status=Campaign.STATUS_PENDING).count()
        if pending_campaigns:
            alerts.append({
                'id': 'pending-campaigns',
                'severity': 'high',
                'title': 'Campagnes a moderer',
                'message': f'{pending_campaigns} campagne(s) attendent une decision admin.',
                'target': '/admin/campaigns',
            })

        failed_payments = Donation.objects.filter(status=Donation.FAILED, created_at__gte=now - timezone.timedelta(days=7)).count()
        if failed_payments:
            alerts.append({
                'id': 'failed-payments',
                'severity': 'medium',
                'title': 'Paiements echoues recents',
                'message': f'{failed_payments} paiement(s) ont echoue sur les 7 derniers jours.',
                'target': '/admin/donations',
            })

        high_value_donations = Donation.objects.filter(
            status=Donation.COMPLETED,
            amount__gte=5000,
            created_at__gte=now - timezone.timedelta(days=7),
        ).count()
        if high_value_donations:
            alerts.append({
                'id': 'high-value-donations',
                'severity': 'medium',
                'title': 'Dons importants a verifier',
                'message': f'{high_value_donations} don(s) de 5000 MAD ou plus cette semaine.',
                'target': '/admin/donations',
            })

        if not alerts:
            alerts.append({
                'id': 'platform-clear',
                'severity': 'low',
                'title': 'Aucune alerte critique',
                'message': 'La file de moderation et les paiements sont sous controle.',
                'target': '/admin/dashboard',
            })

        return Response(alerts)


class AdminExportView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, resource):
        exporters = {
            'users': self.export_users,
            'campaigns': self.export_campaigns,
            'associations': self.export_associations,
            'donations': self.export_donations,
        }
        exporter = exporters.get(resource)
        if not exporter:
            return Response({'error': 'Export inconnu.'}, status=400)

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="ydifydek-{resource}.csv"'
        writer = csv.writer(response)
        exporter(writer)
        return response

    def export_users(self, writer):
        writer.writerow(['id', 'username', 'email', 'role', 'is_active', 'is_staff', 'date_joined'])
        for user in User.objects.exclude(role=User.ROLE_ASSOCIATION).order_by('-date_joined'):
            writer.writerow([user.id, user.username, user.email, user.role, user.is_active, user.is_staff, user.date_joined])

    def export_campaigns(self, writer):
        writer.writerow(['id', 'title', 'association', 'category', 'status', 'is_active', 'goal_amount', 'current_amount', 'deadline', 'created_at'])
        for campaign in Campaign.objects.select_related('association').order_by('-created_at'):
            writer.writerow([
                campaign.id, campaign.title, campaign.association.name, campaign.category,
                campaign.status, campaign.is_active, campaign.goal_amount,
                campaign.current_amount, campaign.deadline, campaign.created_at,
            ])

    def export_associations(self, writer):
        writer.writerow(['id', 'name', 'email', 'moderation_status', 'is_approved', 'total_collected', 'created_at'])
        for association in Association.objects.select_related('user').order_by('-created_at'):
            writer.writerow([
                association.id, association.name, association.user.email,
                association.moderation_status, association.is_approved, association.total_collected, association.created_at,
            ])

    def export_donations(self, writer):
        writer.writerow(['id', 'campaign', 'association', 'donor', 'amount', 'commission_amount', 'net_amount', 'status', 'created_at'])
        for donation in Donation.objects.select_related('campaign', 'campaign__association', 'donor').order_by('-created_at'):
            writer.writerow([
                donation.id, donation.campaign.title, donation.campaign.association.name,
                donation.donor_name, donation.amount, donation.commission_amount,
                donation.net_amount, donation.status, donation.created_at,
            ])
