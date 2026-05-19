from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.notifications.models import Notification
from apps.posts.models import Post
from .models import Comment, CommentReaction
from .serializers import CommentSerializer


class CommentListCreateView(generics.ListCreateAPIView):
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        post_id = self.kwargs["pk"]
        return (
            Comment.objects.filter(post_id=post_id, parent=None, is_visible=True)
            .select_related("post", "author", "author__profile")
            .prefetch_related(
                "reactions",
                "replies",
                "replies__author",
                "replies__author__profile",
                "replies__reactions",
            )
        )

    def get_serializer_context(self):
        return {"request": self.request}

    def perform_create(self, serializer):
        post = get_object_or_404(Post, pk=self.kwargs["pk"])
        parent_id = self.request.data.get("parent")
        parent = None

        if parent_id:
            parent = get_object_or_404(Comment, pk=parent_id, post=post, is_visible=True)

        comment = serializer.save(author=self.request.user, post=post, parent=parent)

        recipient = None
        title = None
        message = None

        if parent and parent.author != self.request.user:
            recipient = parent.author
            title = "Nouvelle reponse a votre commentaire"
            message = f"{self.request.user.username} a repondu a votre commentaire."
        elif post.author != self.request.user:
            recipient = post.author
            title = "Nouveau commentaire sur votre post"
            message = f"{self.request.user.username} a commente votre publication."

        if recipient:
            Notification.objects.create(
                recipient=recipient,
                sender=self.request.user,
                type=Notification.COMMENT,
                title=title,
                message=message,
            )


class CommentDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    queryset = Comment.objects.filter(is_visible=True).select_related("post", "author", "author__profile")

    def get_serializer_context(self):
        return {"request": self.request}

    def update(self, request, *args, **kwargs):
        comment = self.get_object()
        if comment.author != request.user:
            return Response({"error": "Non autorise."}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        comment = self.get_object()
        if comment.author != request.user:
            return Response({"error": "Non autorise."}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)


class CommentReactionToggleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        comment = get_object_or_404(Comment, pk=pk, is_visible=True)
        reaction, created = CommentReaction.objects.get_or_create(comment=comment, user=request.user)

        if not created:
            reaction.delete()
            return Response({
                "is_reacted": False,
                "reactions_count": comment.reactions.count(),
            })

        return Response({
            "is_reacted": True,
            "reactions_count": comment.reactions.count(),
        })


class CommentHideView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, post_pk, comment_pk):
        post = get_object_or_404(Post, pk=post_pk)
        comment = get_object_or_404(Comment, pk=comment_pk, post=post, is_visible=True)

        if post.author != request.user:
            return Response({"error": "Non autorise."}, status=status.HTTP_403_FORBIDDEN)

        comment.is_visible = False
        comment.save(update_fields=["is_visible", "updated_at"])
        return Response({"hidden": True, "message": "Commentaire masque."})
