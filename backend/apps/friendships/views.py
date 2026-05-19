from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.users.models import User
from apps.notifications.models import Notification
from .models import Friendship
from .serializers import FriendshipSerializer


def notify_friendship(recipient, sender, title, message):
    if recipient == sender:
        return
    Notification.objects.create(
        recipient=recipient,
        sender=sender,
        type=Notification.FRIEND,
        title=title,
        message=message,
    )


class FriendshipListView(generics.ListAPIView):
    serializer_class = FriendshipSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            Friendship.objects
            .filter(
                Q(requester=self.request.user) | Q(addressee=self.request.user),
                status=Friendship.ACCEPTED,
            )
            .select_related("requester", "requester__profile", "addressee", "addressee__profile")
        )

    def get_serializer_context(self):
        return {"request": self.request}


class UserFriendshipListView(generics.ListAPIView):
    serializer_class = FriendshipSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = get_object_or_404(User, id=self.kwargs["user_id"])
        return (
            Friendship.objects
            .filter(Q(requester=user) | Q(addressee=user), status=Friendship.ACCEPTED)
            .select_related("requester", "requester__profile", "addressee", "addressee__profile")
        )

    def get_serializer_context(self):
        user = get_object_or_404(User, id=self.kwargs["user_id"])
        return {"request": self.request, "friend_context_user": user}


class FriendshipRequestListView(generics.ListAPIView):
    serializer_class = FriendshipSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        direction = self.request.query_params.get("direction", "incoming")
        qs = (
            Friendship.objects
            .filter(status=Friendship.PENDING)
            .select_related("requester", "requester__profile", "addressee", "addressee__profile")
        )
        if direction == "outgoing":
            return qs.filter(requester=self.request.user)
        return qs.filter(addressee=self.request.user)

    def get_serializer_context(self):
        return {"request": self.request}


class FriendshipSendView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user_id = request.data.get("user_id")
        if not user_id:
            return Response({"error": "user_id requis"}, status=status.HTTP_400_BAD_REQUEST)

        target = get_object_or_404(User, id=user_id)
        if target == request.user:
            return Response(
                {"error": "Vous ne pouvez pas vous ajouter vous-même"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        existing = Friendship.objects.filter(
            Q(requester=request.user, addressee=target) |
            Q(requester=target, addressee=request.user)
        ).first()

        if existing:
            if existing.status == Friendship.ACCEPTED:
                return Response({"error": "Vous êtes déjà amis"}, status=status.HTTP_400_BAD_REQUEST)
            if existing.status == Friendship.PENDING:
                return Response(
                    FriendshipSerializer(existing, context={"request": request}).data,
                    status=status.HTTP_200_OK,
                )
            existing.requester = request.user
            existing.addressee = target
            existing.status = Friendship.PENDING
            existing.save()
        else:
            existing = Friendship.objects.create(requester=request.user, addressee=target)

        notify_friendship(
            recipient=target,
            sender=request.user,
            title=f"{request.user.username} vous a envoyÃ© une demande d'ami",
            message=f"{request.user.username} souhaite vous ajouter Ã  ses amis.",
        )

        return Response(
            FriendshipSerializer(existing, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class FriendshipAcceptView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        friendship = get_object_or_404(
            Friendship,
            pk=pk,
            addressee=request.user,
            status=Friendship.PENDING,
        )
        friendship.status = Friendship.ACCEPTED
        friendship.save(update_fields=["status", "updated_at"])
        notify_friendship(
            recipient=friendship.requester,
            sender=request.user,
            title=f"{request.user.username} a acceptÃ© votre demande d'ami",
            message=f"Vous Ãªtes maintenant amis avec {request.user.username}.",
        )
        return Response(FriendshipSerializer(friendship, context={"request": request}).data)


class FriendshipRejectView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        friendship = get_object_or_404(
            Friendship,
            pk=pk,
            addressee=request.user,
            status=Friendship.PENDING,
        )
        friendship.status = Friendship.REJECTED
        friendship.save(update_fields=["status", "updated_at"])
        return Response(FriendshipSerializer(friendship, context={"request": request}).data)


class FriendshipRemoveView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        friendship = get_object_or_404(
            Friendship.objects.filter(
                Q(requester=request.user) | Q(addressee=request.user),
                pk=pk,
            )
        )
        friendship.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class FriendshipStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, user_id):
        target = get_object_or_404(User, id=user_id)
        friendship = Friendship.objects.filter(
            Q(requester=request.user, addressee=target) |
            Q(requester=target, addressee=request.user)
        ).first()

        if not friendship:
            return Response({"status": "none", "friendship_id": None, "direction": None})

        direction = "outgoing" if friendship.requester_id == request.user.id else "incoming"
        return Response({
            "status": friendship.status,
            "friendship_id": friendship.id,
            "direction": direction,
        })
