# backend/apps/messaging/views.py
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.db.models import Q
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer
from apps.users.models import User


class ConversationListView(generics.ListAPIView):
    """GET /api/messaging/conversations/"""
    serializer_class   = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            Conversation.objects
            .filter(participants=self.request.user)
            .prefetch_related('participants', 'participants__profile', 'messages')
            .order_by('-updated_at')
        )

    def get_serializer_context(self):
        return {'request': self.request}


class ConversationStartView(APIView):
    """POST /api/messaging/start/ — démarrer ou récupérer une conversation"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        other_id = request.data.get('user_id')
        if not other_id:
            return Response({'error': 'user_id requis'}, status=400)

        try:
            other_user = User.objects.get(id=other_id)
        except User.DoesNotExist:
            return Response({'error': 'Utilisateur introuvable'}, status=404)

        if other_user == request.user:
            return Response({'error': 'Vous ne pouvez pas vous écrire à vous-même'}, status=400)

        # Chercher conversation existante
        conv = (
            Conversation.objects
            .filter(participants=request.user)
            .filter(participants=other_user)
            .first()
        )

        if not conv:
            conv = Conversation.objects.create()
            conv.participants.add(request.user, other_user)

        serializer = ConversationSerializer(conv, context={'request': request})
        return Response(serializer.data, status=200)


class MessageListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/messaging/conversations/:id/messages/ — liste des messages
    POST /api/messaging/conversations/:id/messages/ — envoyer un message
    """
    serializer_class   = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        conv_id = self.kwargs['conv_id']

        # Vérifier que l'user fait partie de la conversation
        if not Conversation.objects.filter(
            id=conv_id, participants=self.request.user
        ).exists():
            raise PermissionDenied("Accès refusé à cette conversation")

        # ✅ Marquer les messages non lus comme lus
        Message.objects.filter(
            conversation_id=conv_id,
            is_read=False
        ).exclude(sender=self.request.user).update(is_read=True)

        return (
            Message.objects
            .filter(conversation_id=conv_id)
            .select_related('sender', 'sender__profile')
            .order_by('created_at')
        )

    def get_serializer_context(self):
        return {'request': self.request}

    def perform_create(self, serializer):
        conv_id = self.kwargs['conv_id']

        try:
            conv = Conversation.objects.get(
                id=conv_id,
                participants=self.request.user
            )
        except Conversation.DoesNotExist:
            raise PermissionDenied("Conversation introuvable")

        content = self.request.data.get('content', '').strip()
        media   = self.request.FILES.get('media', None)

        if not content and not media:
            raise ValidationError({'error': 'Le message ne peut pas être vide'})

        serializer.save(
            conversation=conv,
            sender=self.request.user,
            content=content,
            media=media,
        )

        # ✅ Met à jour le timestamp de la conversation
        conv.save()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class MessageDeleteView(APIView):
    """DELETE /api/messaging/messages/:id/ — supprimer son message"""
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, msg_id):
        try:
            msg = Message.objects.get(id=msg_id, sender=request.user)
        except Message.DoesNotExist:
            return Response({'error': 'Message introuvable'}, status=404)

        msg.delete()
        return Response({'detail': 'Message supprimé'}, status=204)


class UnreadCountView(APIView):
    """GET /api/messaging/unread/ — nombre total de messages non lus"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        count = Message.objects.filter(
            conversation__participants=request.user,
            is_read=False
        ).exclude(sender=request.user).count()
        return Response({'count': count})
