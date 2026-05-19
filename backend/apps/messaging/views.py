from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import OperationalError, transaction

from apps.notifications.models import Notification
from apps.posts.models import Post
from .models import CallSession, Conversation, Message
from .serializers import CallSessionSerializer, ConversationSerializer, MessageSerializer


def with_db_retry(callback, attempts=3):
    last_error = None
    for _ in range(attempts):
        try:
            with transaction.atomic():
                return callback()
        except OperationalError as exc:
            last_error = exc
    raise last_error


class ConversationListView(generics.ListAPIView):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            Conversation.objects.filter(participants=self.request.user)
            .prefetch_related("participants", "participants__profile", "messages")
            .order_by("-updated_at")
        )

    def get_serializer_context(self):
        return {"request": self.request}


class ConversationStartView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        other_id = request.data.get("user_id")
        if not other_id:
            return Response({"error": "user_id requis"}, status=400)

        from apps.users.models import User

        try:
            other_user = User.objects.get(id=other_id)
        except User.DoesNotExist:
            return Response({"error": "Utilisateur introuvable"}, status=404)

        if other_user == request.user:
            return Response({"error": "Vous ne pouvez pas vous ecrire a vous-meme"}, status=400)

        conv = (
            Conversation.objects.filter(participants=request.user)
            .filter(participants=other_user)
            .first()
        )

        if not conv:
            conv = Conversation.objects.create()
            conv.participants.add(request.user, other_user)

        serializer = ConversationSerializer(conv, context={"request": request})
        return Response(serializer.data, status=200)


class MessageListCreateView(generics.ListCreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        conv_id = self.kwargs["conv_id"]

        if not Conversation.objects.filter(id=conv_id, participants=self.request.user).exists():
            raise PermissionDenied("Acces refuse a cette conversation")

        try:
            with_db_retry(
                lambda: Message.objects.filter(
                    conversation_id=conv_id,
                    is_read=False,
                ).exclude(sender=self.request.user).update(is_read=True)
            )
        except OperationalError:
            pass

        return (
            Message.objects.filter(conversation_id=conv_id)
            .select_related(
                "sender",
                "sender__profile",
                "shared_post",
                "shared_post__author",
                "shared_post__author__profile",
            )
            .prefetch_related("shared_post__media_items")
            .order_by("created_at")
        )

    def get_serializer_context(self):
        return {"request": self.request}

    def perform_create(self, serializer):
        conv_id = self.kwargs["conv_id"]

        try:
            conv = Conversation.objects.get(id=conv_id, participants=self.request.user)
        except Conversation.DoesNotExist:
            raise PermissionDenied("Conversation introuvable")

        content = self.request.data.get("content", "").strip()
        media = self.request.FILES.get("media", None)
        file_name = media.name if media else self.request.data.get("file_name", "")
        shared_post_id = self.request.data.get("shared_post")
        location_lat = self.request.data.get("location_lat")
        location_lng = self.request.data.get("location_lng")
        shared_post = None
        message_type = Message.TYPE_TEXT

        if shared_post_id:
            try:
                shared_post = Post.objects.get(id=shared_post_id, is_visible=True)
            except Post.DoesNotExist:
                raise ValidationError({"shared_post": "Publication introuvable"})

        has_location = location_lat not in (None, "") and location_lng not in (None, "")

        if not content and not media and not shared_post and not has_location:
            raise ValidationError({"error": "Le message ne peut pas etre vide"})

        if shared_post:
            message_type = Message.TYPE_SHARED_POST
        elif has_location:
            message_type = Message.TYPE_LOCATION
        elif media:
            media_type = (media.content_type or "").lower()
            if media_type.startswith("image/"):
                message_type = Message.TYPE_IMAGE
            elif media_type.startswith("video/"):
                message_type = Message.TYPE_VIDEO
            elif media_type.startswith("audio/"):
                message_type = Message.TYPE_AUDIO

        with_db_retry(
            lambda: serializer.save(
                conversation=conv,
                sender=self.request.user,
                message_type=message_type,
                content=content,
                media=media,
                file_name=file_name,
                location_lat=location_lat or None,
                location_lng=location_lng or None,
                shared_post=shared_post,
            )
        )

        for recipient in conv.participants.exclude(id=self.request.user.id):
            if content:
                preview = content[:180]
            elif shared_post:
                preview = "Vous avez recu une publication."
            elif has_location:
                preview = "Vous avez recu une localisation."
            elif media:
                preview = f"Vous avez recu {file_name or 'un fichier'}."
            else:
                preview = "Nouveau message."
            with_db_retry(
                lambda recipient=recipient, preview=preview: Notification.objects.create(
                    recipient=recipient,
                    sender=self.request.user,
                    type=Notification.MESSAGE,
                    title=f"Nouveau message de {self.request.user.username}",
                    message=preview,
                )
            )

        with_db_retry(lambda: conv.save())

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        instance = Message.objects.select_related(
            "sender",
            "sender__profile",
            "shared_post",
            "shared_post__author",
            "shared_post__author__profile",
        ).prefetch_related("shared_post__media_items").get(id=serializer.instance.id)

        output = self.get_serializer(instance)
        return Response(output.data, status=status.HTTP_201_CREATED)


class MessageDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, msg_id):
        try:
            msg = Message.objects.get(id=msg_id, sender=request.user)
        except Message.DoesNotExist:
            return Response({"error": "Message introuvable"}, status=404)

        msg.delete()
        return Response({"detail": "Message supprime"}, status=204)


class UnreadCountView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        count = Message.objects.filter(
            conversation__participants=request.user,
            is_read=False,
        ).exclude(sender=request.user).count()
        return Response({"count": count})


def get_conversation_for_user(conv_id, user):
    try:
        return Conversation.objects.get(id=conv_id, participants=user)
    except Conversation.DoesNotExist:
        raise PermissionDenied("Conversation introuvable")


def get_call_for_user(call_id, user):
    try:
        return CallSession.objects.select_related(
            "conversation",
            "caller",
            "caller__profile",
            "callee",
            "callee__profile",
        ).get(id=call_id, conversation__participants=user)
    except CallSession.DoesNotExist:
        raise PermissionDenied("Appel introuvable")


class CurrentCallView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, conv_id):
        conversation = get_conversation_for_user(conv_id, request.user)
        call = (
            CallSession.objects.filter(
                conversation=conversation,
                status__in=[CallSession.STATUS_RINGING, CallSession.STATUS_ACTIVE],
            )
            .select_related("caller", "caller__profile", "callee", "callee__profile")
            .first()
        )

        if not call:
            return Response({"call": None})

        return Response({"call": CallSessionSerializer(call, context={"request": request}).data})


class StartCallView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, conv_id):
        conversation = get_conversation_for_user(conv_id, request.user)
        call_type = request.data.get("call_type")

        if call_type not in [CallSession.TYPE_VOICE, CallSession.TYPE_VIDEO]:
            raise ValidationError({"call_type": "Type d'appel invalide"})

        other_participant = conversation.participants.exclude(id=request.user.id).first()
        if not other_participant:
            raise ValidationError({"error": "Aucun destinataire pour cet appel"})

        existing = (
            CallSession.objects.filter(
                conversation=conversation,
                status__in=[CallSession.STATUS_RINGING, CallSession.STATUS_ACTIVE],
            )
            .select_related("caller", "caller__profile", "callee", "callee__profile")
            .first()
        )
        if existing:
            return Response(
                {"call": CallSessionSerializer(existing, context={"request": request}).data},
                status=status.HTTP_200_OK,
            )

        call = CallSession.objects.create(
            conversation=conversation,
            caller=request.user,
            callee=other_participant,
            call_type=call_type,
            status=CallSession.STATUS_RINGING,
        )

        Notification.objects.create(
            recipient=other_participant,
            sender=request.user,
            type=Notification.MESSAGE,
            title=f"Appel de {request.user.username}",
            message="Appel video entrant." if call_type == CallSession.TYPE_VIDEO else "Appel vocal entrant.",
        )

        return Response(
            {"call": CallSessionSerializer(call, context={"request": request}).data},
            status=status.HTTP_201_CREATED,
        )


class CallSignalView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, call_id):
        call = get_call_for_user(call_id, request.user)
        if call.status not in [CallSession.STATUS_RINGING, CallSession.STATUS_ACTIVE]:
            return Response({"error": "Cet appel n'est plus actif"}, status=status.HTTP_400_BAD_REQUEST)

        if request.user.id == call.caller_id:
            role_candidates_field = "caller_candidates"
        elif request.user.id == call.callee_id:
            role_candidates_field = "callee_candidates"
        else:
            raise PermissionDenied("Acces refuse")

        offer_sdp = request.data.get("offer_sdp")
        answer_sdp = request.data.get("answer_sdp")
        candidate = request.data.get("candidate")

        if offer_sdp:
            call.offer_sdp = offer_sdp
        if answer_sdp:
            call.answer_sdp = answer_sdp
            if call.status == CallSession.STATUS_RINGING:
                call.status = CallSession.STATUS_ACTIVE
                call.started_at = call.started_at or timezone.now()
        if candidate:
            current_candidates = list(getattr(call, role_candidates_field) or [])
            current_candidates.append(candidate)
            setattr(call, role_candidates_field, current_candidates)

        call.save(update_fields=[
            "offer_sdp",
            "answer_sdp",
            "caller_candidates",
            "callee_candidates",
            "status",
            "started_at",
            "updated_at",
        ])

        return Response({"call": CallSessionSerializer(call, context={"request": request}).data})


class AcceptCallView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, call_id):
        call = get_call_for_user(call_id, request.user)
        if request.user.id != call.callee_id:
            raise PermissionDenied("Seul le destinataire peut accepter cet appel")
        if call.status != CallSession.STATUS_RINGING:
            return Response({"error": "Cet appel ne peut plus etre accepte"}, status=status.HTTP_400_BAD_REQUEST)

        call.status = CallSession.STATUS_ACTIVE
        call.started_at = timezone.now()
        call.save(update_fields=["status", "started_at", "updated_at"])

        return Response({"call": CallSessionSerializer(call, context={"request": request}).data})


class DeclineCallView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, call_id):
        call = get_call_for_user(call_id, request.user)
        if request.user.id not in [call.caller_id, call.callee_id]:
            raise PermissionDenied("Acces refuse")

        call.status = CallSession.STATUS_DECLINED
        call.ended_at = timezone.now()
        call.save(update_fields=["status", "ended_at", "updated_at"])

        return Response({"call": CallSessionSerializer(call, context={"request": request}).data})


class EndCallView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, call_id):
        call = get_call_for_user(call_id, request.user)
        if request.user.id not in [call.caller_id, call.callee_id]:
            raise PermissionDenied("Acces refuse")

        call.status = CallSession.STATUS_ENDED
        call.ended_at = timezone.now()
        call.save(update_fields=["status", "ended_at", "updated_at"])

        return Response({"call": CallSessionSerializer(call, context={"request": request}).data})
