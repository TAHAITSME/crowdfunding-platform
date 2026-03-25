# backend/apps/notifications/models.py
import uuid
from django.db import models
from django.utils import timezone
from django.conf import settings
from apps.users.models import User

class Notification(models.Model):
    LIKE        = 'like'
    COMMENT     = 'comment'
    DONATION    = 'donation'
    FRIEND      = 'friend_request'
    MESSAGE     = 'message'
    FOLLOW      = 'follow'

    TYPE_CHOICES = [
        (LIKE,    'Like'),
        (COMMENT, 'Commentaire'),
        (DONATION,'Don'),
        (FRIEND,  'Demande d\'ami'),
        (MESSAGE, 'Message'),
        (FOLLOW,  'Suivi'),
    ]

    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient  = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    sender     = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_notifications', null=True, blank=True)
    type       = models.CharField(max_length=30, choices=TYPE_CHOICES)
    title      = models.CharField(max_length=200)
    message    = models.TextField(blank=True)
    is_read    = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table  = 'notifications'
        ordering  = ['-created_at']

    def __str__(self):
        return f"{self.recipient.username} – {self.type} – {self.title}"
