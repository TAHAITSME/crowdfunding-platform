import uuid
from django.db import models
from django.conf import settings
from apps.posts.models import Post


class Conversation(models.Model):
    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    participants = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='conversations')
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'conversations'
        ordering = ['-updated_at']

    def __str__(self):
        return f"Conv {self.id}"


class Message(models.Model):
    TYPE_TEXT = 'text'
    TYPE_IMAGE = 'image'
    TYPE_VIDEO = 'video'
    TYPE_AUDIO = 'audio'
    TYPE_LOCATION = 'location'
    TYPE_SHARED_POST = 'shared_post'

    MESSAGE_TYPES = [
        (TYPE_TEXT, 'Text'),
        (TYPE_IMAGE, 'Image'),
        (TYPE_VIDEO, 'Video'),
        (TYPE_AUDIO, 'Audio'),
        (TYPE_LOCATION, 'Location'),
        (TYPE_SHARED_POST, 'Shared Post'),
    ]

    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender       = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_messages')
    message_type = models.CharField(max_length=20, choices=MESSAGE_TYPES, default=TYPE_TEXT)
    content      = models.TextField(blank=True)
    media        = models.FileField(upload_to='messages/media/', blank=True, null=True)
    file_name    = models.CharField(max_length=255, blank=True, default='')
    location_lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    location_lng = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    shared_post  = models.ForeignKey(Post, on_delete=models.SET_NULL, null=True, blank=True, related_name='shared_messages')
    is_read      = models.BooleanField(default=False)
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'messages'
        ordering = ['created_at']

    def __str__(self):
        return f"{self.sender.username}: {self.content[:40]}"


class CallSession(models.Model):
    TYPE_VOICE = 'voice'
    TYPE_VIDEO = 'video'

    STATUS_RINGING = 'ringing'
    STATUS_ACTIVE = 'active'
    STATUS_DECLINED = 'declined'
    STATUS_ENDED = 'ended'
    STATUS_MISSED = 'missed'

    CALL_TYPES = [
        (TYPE_VOICE, 'Voice'),
        (TYPE_VIDEO, 'Video'),
    ]

    STATUSES = [
        (STATUS_RINGING, 'Ringing'),
        (STATUS_ACTIVE, 'Active'),
        (STATUS_DECLINED, 'Declined'),
        (STATUS_ENDED, 'Ended'),
        (STATUS_MISSED, 'Missed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='call_sessions')
    caller = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='outgoing_calls')
    callee = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='incoming_calls')
    call_type = models.CharField(max_length=10, choices=CALL_TYPES)
    status = models.CharField(max_length=20, choices=STATUSES, default=STATUS_RINGING)
    offer_sdp = models.TextField(blank=True, default='')
    answer_sdp = models.TextField(blank=True, default='')
    caller_candidates = models.JSONField(default=list, blank=True)
    callee_candidates = models.JSONField(default=list, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'call_sessions'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.caller.username} -> {self.callee.username} ({self.call_type})"
