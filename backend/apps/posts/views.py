# backend/apps/posts/views.py
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Post, SavedPost
from .serializers import PostSerializer


class PostListCreateView(generics.ListCreateAPIView):
    serializer_class   = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        return Post.objects.filter(is_visible=True).select_related(
            'author', 'tagged_association'
        )

    def perform_create(self, serializer):
        # Vérifie la limite de posts par jour (anti-spam)
        from django.utils import timezone
        user = self.request.user
        today = timezone.now().date()

        if user.last_post_date == today and user.daily_post_count >= 10:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Limite de 10 posts par jour atteinte.")

        if user.last_post_date != today:
            user.daily_post_count = 0
            user.last_post_date   = today

        user.daily_post_count += 1
        user.save()

        serializer.save(author=self.request.user)


class PostDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    queryset           = Post.objects.filter(is_visible=True)

    def update(self, request, *args, **kwargs):
        post = self.get_object()
        if post.author != request.user:
            return Response({'error': 'Non autorisé.'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        post = self.get_object()
        if post.author != request.user:
            return Response({'error': 'Non autorisé.'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)


class SavePostView(APIView):
    """Sauvegarder ou désauvegarder un post"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        post = generics.get_object_or_404(Post, pk=pk)
        saved, created = SavedPost.objects.get_or_create(user=request.user, post=post)

        if not created:
            saved.delete()
            return Response({'message': 'Post retiré des sauvegardes.'})
        return Response({'message': 'Post sauvegardé ✅'})


class SavedPostListView(generics.ListAPIView):
    """Liste des posts sauvegardés par l'utilisateur"""
    serializer_class   = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Post.objects.filter(
            saved_posts__user=self.request.user,
            is_visible=True
        )

class LikePostView(APIView):
    """Liker ou unliker un post"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        from .models import Like
        post = generics.get_object_or_404(Post, pk=pk)
        like, created = Like.objects.get_or_create(user=request.user, post=post)

        if not created:
            like.delete()
            return Response({
                'is_liked': False,
                'likes_count': post.likes.count()
            })
        return Response({
            'is_liked': True,
            'likes_count': post.likes.count()
        })
