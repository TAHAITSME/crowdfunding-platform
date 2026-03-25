import uuid
from django.db import models
from django.conf import settings


class Follow(models.Model):
    """Modèle de relation follow entre utilisateurs"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    follower = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='following_set'  # l'utilisateur que je suis
    )
    following = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='followers_set'  # mes followers
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'follows'
        unique_together = ('follower', 'following')  # Un seul follow par paire
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['follower']),
            models.Index(fields=['following']),
        ]
    
    def __str__(self):
        return f"{self.follower.username} follows {self.following.username}"
    
    def save(self, *args, **kwargs):
        """Empêcher un utilisateur de se suivre lui-même"""
        if self.follower == self.following:
            raise ValueError("Un utilisateur ne peut pas se suivre lui-même")
        super().save(*args, **kwargs)
