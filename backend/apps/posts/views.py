from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404
from django.utils import timezone

from .models import Post, SavedPost, Like
from .serializers import PostSerializer


class PostListCreateView(generics.ListCreateAPIView):
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        return Post.objects.filter(is_visible=True).select_related(
            "author", "tagged_association"
        )

    def perform_create(self, serializer):
        user = self.request.user
        today = timezone.now().date()

        if user.last_post_date == today and user.daily_post_count >= 10:
            raise PermissionDenied("Limite de 10 posts par jour atteinte.")

        if user.last_post_date != today:
            user.daily_post_count = 0
            user.last_post_date = today

        user.daily_post_count += 1
        user.save()

        serializer.save(author=self.request.user, is_visible=True)


class PostDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        return Post.objects.select_related("author", "tagged_association")

    def update(self, request, *args, **kwargs):
        post = self.get_object()
        if post.author != request.user:
            return Response({"error": "Non autorisé."}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        post = self.get_object()
        if post.author != request.user:
            return Response({"error": "Non autorisé."}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)


class SavePostView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        post = get_object_or_404(Post, pk=pk)
        saved, created = SavedPost.objects.get_or_create(user=request.user, post=post)

        if not created:
            saved.delete()
            return Response({"saved": False, "message": "Post retiré des sauvegardes."})

        return Response({"saved": True, "message": "Post sauvegardé ✅"})


class SavedPostListView(generics.ListAPIView):
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Post.objects.filter(
            saved_items__user=self.request.user,
            is_visible=True
        ).select_related("author", "tagged_association")


class LikePostView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        post = get_object_or_404(Post, pk=pk)
        like, created = Like.objects.get_or_create(user=request.user, post=post)

        if not created:
            like.delete()
            return Response({
                "is_liked": False,
                "likes_count": post.likes.count()
            })

        return Response({
            "is_liked": True,
            "likes_count": post.likes.count()
        })
