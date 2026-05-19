from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

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
                {"detail": "Vous ne pouvez pas vous suivre vous-même"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        follow = Follow.objects.filter(
            follower=requester,
            following=target_user
        ).first()

        if follow:
            follow.delete()
            return Response(
                {
                    "is_following": False,
                    "message": f"Vous ne suivez plus {target_user.username}",
                },
                status=status.HTTP_200_OK,
            )

        Follow.objects.create(follower=requester, following=target_user)

        # La notification est créée dans le signal, pas ici.
        return Response(
            {
                "is_following": True,
                "message": f"Vous suivez maintenant {target_user.username}",
            },
            status=status.HTTP_200_OK,
        )


class IsFollowingView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, user_id):
        target_user = get_object_or_404(User, id=user_id)

        is_following = Follow.objects.filter(
            follower=request.user,
            following=target_user
        ).exists()

        return Response({"is_following": is_following})


class FollowersListView(generics.ListAPIView):
    serializer_class = FollowSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        user_id = self.kwargs.get("user_id")
        target_user = get_object_or_404(User, id=user_id)
        return Follow.objects.filter(following=target_user).select_related(
            "follower", "follower__profile"
        )


class FollowingListView(generics.ListAPIView):
    serializer_class = FollowSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        user_id = self.kwargs.get("user_id")
        target_user = get_object_or_404(User, id=user_id)
        return Follow.objects.filter(follower=target_user).select_related(
            "following", "following__profile"
        )


class SuggestionsView(generics.ListAPIView):
    serializer_class = UserBriefSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        following_ids = Follow.objects.filter(
            follower=user
        ).values_list("following_id", flat=True)

        # Suggestions réelles :
        # - pas moi
        # - pas déjà suivis
        # - pas admin
        # - profils publics seulement
        # - tri par "amitiés en commun"
        return (
            User.objects.select_related("profile")
            .filter(role__in=[User.ROLE_USER, User.ROLE_ASSOCIATION])
            .exclude(id=user.id)
            .exclude(id__in=following_ids)
            .filter(profile__privacy=Profile.PUBLIC)
            .order_by("-is_verified", "-date_joined")[:10]
        )
