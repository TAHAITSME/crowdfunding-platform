import uuid
from django.db import models
from apps.users.models import User
from apps.posts.models import Post


class Reaction(models.Model):
    LIKE    = 'like'
    LOVE    = 'love'
    SUPPORT = 'support'
    FUNNY   = 'funny'
    SAD     = 'sad'

    REACTION_TYPES = [
        (LIKE,    '👍 Like'),
        (LOVE,    '❤️ Love'),
        (SUPPORT, '🤝 Support'),
        (FUNNY,   '😄 Funny'),
        (SAD,     '😢 Sad'),
    ]

    id            = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user          = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reactions')
    post          = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='reactions')
    reaction_type = models.CharField(max_length=10, choices=REACTION_TYPES, default=LIKE)
    created_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table        = 'reactions'
        unique_together = ('user', 'post')  # 1 réaction par user par post

    def __str__(self):
        return f"{self.user.username} — {self.reaction_type} — {self.post.id}"
