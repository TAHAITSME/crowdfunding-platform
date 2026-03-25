from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q

from .models import Follow
from .serializers import FollowSerializer, UserBriefSerializer
from apps.users.models import User, Profile


class FollowToggleView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, user_id):
        target_user = get_object_or_404(User, id=user_id)
        requester = request.user
        
        if target_user == requester:
            return Response(
                {'detail': 'Vous ne pouvez pas vous suivre vous-même'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        follow = Follow.objects.filter(follower=requester, following=target_user).first()
        
        if follow:
            follow.delete()
            return Response({
                'is_following': False,
                'message': f"Vous ne suivez plus {target_user.username}"
            }, status=status.HTTP_200_OK)
        else:
            Follow.objects.create(follower=requester, following=target_user)
            
            # ✅ Créer la notification automatiquement
            from apps.notifications.models import Notification
            Notification.objects.create(
                recipient=target_user,
                sender=requester,
                type=Notification.FOLLOW,
                title=f"{requester.username} a commencé à vous suivre",
                message=""
            )
            
            return Response({
                'is_following': True,
                'message': f"Vous suivez maintenant {target_user.username}"
            }, status=status.HTTP_200_OK)



class IsFollowingView(APIView):
    """Vérifier si l'utilisateur connecté suit un autre utilisateur"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, user_id):
        """GET /api/users/<user_id>/is_following/"""
        target_user = get_object_or_404(User, id=user_id)
        
        is_following = Follow.objects.filter(
            follower=request.user,
            following=target_user
        ).exists()
        
        return Response({'is_following': is_following})


class FollowersListView(generics.ListAPIView):
    """Liste tous les followers d'un utilisateur"""
    serializer_class = FollowSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        user_id = self.kwargs.get('user_id')
        target_user = get_object_or_404(User, id=user_id)
        
        return Follow.objects.filter(following=target_user).select_related('follower')


class FollowingListView(generics.ListAPIView):
    """Liste tous les utilisateurs qu'un utilisateur suit"""
    serializer_class = FollowSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        user_id = self.kwargs.get('user_id')
        target_user = get_object_or_404(User, id=user_id)
        
        return Follow.objects.filter(follower=target_user).select_related('following')


class SuggestionsView(generics.ListAPIView):
    """Suggestions d'amis : utilisateurs non suivis"""
    serializer_class = UserBriefSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Retourne max 10 utilisateurs non suivis par l'utilisateur connecté"""
        user = self.request.user
        
        # IDs des utilisateurs que je suis déjà
        following_ids = Follow.objects.filter(follower=user).values_list('following_id', flat=True)
        
        # Exclure: moi-même + les utilisateurs que je suis déjà
        suggestions = User.objects.exclude(
            Q(id=user.id) | Q(id__in=following_ids)
        ).order_by('?')[:10]  # Random order, max 10
        
        return suggestions
