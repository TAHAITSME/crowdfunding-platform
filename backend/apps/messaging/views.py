from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer
from apps.users.models import User


class ConversationListView(generics.ListAPIView):
    """GET /api/messaging/conversations/ — liste mes conversations"""
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Conversation.objects.filter(
            participants=self.request.user
        ).prefetch_related('participants', 'messages').order_by('-updated_at')

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

        # Chercher une conversation existante entre les deux
        conv = Conversation.objects.filter(
            participants=request.user
        ).filter(
            participants=other_user
        ).first()

        if not conv:
            conv = Conversation.objects.create()
            conv.participants.add(request.user, other_user)

        serializer = ConversationSerializer(conv, context={'request': request})
        return Response(serializer.data)


class MessageListView(generics.ListAPIView):
    """GET /api/messaging/conversations/:id/messages/ — messages d'une conv"""
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        conv_id = self.kwargs['conv_id']
        # Marquer comme lus
        Message.objects.filter(
            conversation_id=conv_id,
            is_read=False
        ).exclude(sender=self.request.user).update(is_read=True)

        return Message.objects.filter(
            conversation_id=conv_id
        ).select_related('sender', 'sender__profile')

    def get_serializer_context(self):
        return {'request': self.request}


class MessageSendView(APIView):
    """POST /api/messaging/conversations/:id/send/ — envoyer un message"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, conv_id):
        try:
            conv = Conversation.objects.get(id=conv_id, participants=request.user)
        except Conversation.DoesNotExist:
            return Response({'error': 'Conversation introuvable'}, status=404)

        content = request.data.get('content', '').strip()
        media   = request.FILES.get('media')

        if not content and not media:
            return Response({'error': 'Message vide'}, status=400)

        msg = Message.objects.create(
            conversation=conv,
            sender=request.user,
            content=content,
            media=media,
        )
        # Update conv timestamp
        conv.save()

        serializer = MessageSerializer(msg, context={'request': request})
        return Response(serializer.data, status=201)
