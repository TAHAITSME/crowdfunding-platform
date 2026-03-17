from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import Comment
from .serializers import CommentSerializer


class CommentListCreateView(generics.ListCreateAPIView):
    serializer_class   = CommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        post_id = self.kwargs['pk']
        # Retourne uniquement les commentaires principaux (pas les réponses)
        return Comment.objects.filter(
            post_id=post_id,
            parent=None,
            is_visible=True
        ).prefetch_related('replies')

    def perform_create(self, serializer):
        from apps.posts.models import Post
        from apps.notifications.models import Notification

        post = generics.get_object_or_404(Post, pk=self.kwargs['pk'])
        comment = serializer.save(author=self.request.user, post=post)

        # Créer une notification pour l'auteur du post (sauf si c'est lui-même)
        if post.author != self.request.user:
            Notification.objects.create(
                user=post.author,
                type=Notification.COMMENT,
                title="Nouveau commentaire sur votre post",
                message=f"{self.request.user.username} a commenté votre publication."
            )


class CommentDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = CommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    queryset           = Comment.objects.filter(is_visible=True)

    def update(self, request, *args, **kwargs):
        comment = self.get_object()
        if comment.author != request.user:
            return Response({'error': 'Non autorisé.'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        comment = self.get_object()
        if comment.author != request.user:
            return Response({'error': 'Non autorisé.'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)
