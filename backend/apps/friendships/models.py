import uuid
from django.conf import settings
from django.db import models


class Friendship(models.Model):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"

    STATUS_CHOICES = [
        (PENDING, "En attente"),
        (ACCEPTED, "Acceptée"),
        (REJECTED, "Refusée"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    requester = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sent_friend_requests",
    )
    addressee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="received_friend_requests",
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "friendships"
        ordering = ["-updated_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["requester", "addressee"],
                name="unique_friendship_direction",
            ),
            models.CheckConstraint(
                check=~models.Q(requester=models.F("addressee")),
                name="prevent_self_friendship",
            ),
        ]
        indexes = [
            models.Index(fields=["requester", "status"]),
            models.Index(fields=["addressee", "status"]),
        ]

    def __str__(self):
        return f"{self.requester} -> {self.addressee} ({self.status})"

    def involves(self, user):
        return self.requester_id == user.id or self.addressee_id == user.id

    def other_user(self, user):
        if self.requester_id == user.id:
            return self.addressee
        if self.addressee_id == user.id:
            return self.requester
        return None
