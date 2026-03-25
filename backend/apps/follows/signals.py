# backend/apps/follows/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Follow
from apps.notifications.models import Notification


@receiver(post_save, sender=Follow)
def create_follow_notification(sender, instance, created, **kwargs):
    """
    Crée automatiquement une notification quand quelqu'un suit un utilisateur
    """
    if created:
        Notification.objects.create(
            recipient=instance.following,
            sender=instance.follower,
            type=Notification.FOLLOW,
            title=f"{instance.follower.username} a commencé à vous suivre",
            message=f"{instance.follower.username} ({instance.follower.email}) vous suit maintenant."
        )
