# backend/apps/notifications/views.py
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notification
from .serializers import NotificationSerializer


class NotificationListView(generics.ListAPIView):
    serializer_class   = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            Notification.objects
            .filter(recipient=self.request.user)
            .select_related('sender', 'sender__profile')  # ✅ évite N+1 queries
            .order_by('-created_at')
        )

    # ✅ Passe request → build_absolute_uri pour l'avatar
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class UnreadCountView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(
            recipient=request.user,
            is_read=False
        ).count()
        return Response({'count': count})


class MarkAsReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, notification_id):
        try:
            notif = Notification.objects.select_related(
                'sender', 'sender__profile'   # ✅ aussi ici
            ).get(id=notification_id, recipient=request.user)
        except Notification.DoesNotExist:
            return Response(
                {'detail': 'Notification not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        notif.is_read = True
        notif.save()

        # ✅ Passe request au contexte
        serializer = NotificationSerializer(
            notif, context={'request': request}
        )
        return Response(serializer.data)


class MarkAllAsReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request):
        count = Notification.objects.filter(
            recipient=request.user,
            is_read=False
        ).update(is_read=True)

        return Response({
            'message': f'{count} notifications marquées comme lues',
            'count': count
        })
