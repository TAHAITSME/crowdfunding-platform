import uuid
from django.db import models
from apps.users.models import User
from apps.associations.models import Association
class Post(models.Model):
    DISCUSSION = "discussion"
    SOLIDARITY = "solidarity"
    VIDEO = "video"

    POST_TYPES = [
        (DISCUSSION, "Discussion"),
        (SOLIDARITY, "Solidaire"),
        (VIDEO, "Vidéo"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="posts")
    content = models.TextField()
    post_type = models.CharField(max_length=20, choices=POST_TYPES, default=DISCUSSION)
    media = models.FileField(upload_to="posts/media/", blank=True, null=True)
    tagged_association = models.ForeignKey(
        Association,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tagged_posts",
    )
    is_repost = models.BooleanField(default=False)
    original_post = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reposts",
    )
    is_visible = models.BooleanField(default=True)
    views_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "posts"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.author.username} — {self.post_type} — {self.created_at.date()}"


class SavedPost(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="saved_posts")
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="saved_items")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "saved_posts"
        unique_together = ("user", "post")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.username} saved {self.post.id}"


class Like(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="likes")
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="likes")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "likes"
        unique_together = ("user", "post")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.username} ❤️ {self.post.id}"
