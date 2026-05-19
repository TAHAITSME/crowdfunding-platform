from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Like, Post, PostMedia, SavedPost
from .serializers import PostSerializer


def resolve_target_post(post):
    return post.original_post if post.is_repost and post.original_post else post


class PostListCreateView(generics.ListCreateAPIView):
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        return (
            Post.objects.filter(is_visible=True)
            .select_related(
                "author",
                "author__profile",
                "tagged_association",
                "original_post",
                "original_post__author",
                "original_post__author__profile",
                "original_post__tagged_association",
            )
            .prefetch_related(
                "media_items",
                "likes",
                "comments",
                "original_post__media_items",
                "original_post__likes",
                "original_post__comments",
            )
        )

    def get_serializer_context(self):
        return {"request": self.request}

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

        post = serializer.save(author=self.request.user, is_visible=True)

        media_files = self.request.FILES.getlist("media_files")
        for index, file_obj in enumerate(media_files):
            PostMedia.objects.create(post=post, file=file_obj, sort_order=index)


class PostDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        return (
            Post.objects.select_related(
                "author",
                "author__profile",
                "tagged_association",
                "original_post",
                "original_post__author",
                "original_post__author__profile",
                "original_post__tagged_association",
            ).prefetch_related("media_items", "original_post__media_items")
        )

    def get_serializer_context(self):
        return {"request": self.request}

    def update(self, request, *args, **kwargs):
        post = self.get_object()
        if post.author != request.user:
            return Response({"error": "Non autorise."}, status=status.HTTP_403_FORBIDDEN)

        response = super().update(request, *args, **kwargs)

        media_files = request.FILES.getlist("media_files")
        if media_files:
            post.media_items.all().delete()
            for index, file_obj in enumerate(media_files):
                PostMedia.objects.create(post=post, file=file_obj, sort_order=index)

        return response

    def destroy(self, request, *args, **kwargs):
        post = self.get_object()
        if post.author != request.user:
            return Response({"error": "Non autorise."}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)


class SavePostView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        post = resolve_target_post(get_object_or_404(Post, pk=pk, is_visible=True))
        saved, created = SavedPost.objects.get_or_create(user=request.user, post=post)

        if not created:
            saved.delete()
            return Response({"saved": False, "message": "Post retire des sauvegardes."})

        return Response({"saved": True, "message": "Post sauvegarde."})


class SavedPostListView(generics.ListAPIView):
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            Post.objects.filter(saved_items__user=self.request.user, is_visible=True)
            .select_related("author", "author__profile", "tagged_association")
            .prefetch_related("media_items")
        )

    def get_serializer_context(self):
        return {"request": self.request}


class LikePostView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        post = resolve_target_post(get_object_or_404(Post, pk=pk, is_visible=True))
        like, created = Like.objects.get_or_create(user=request.user, post=post)

        if not created:
            like.delete()
            return Response({"is_liked": False, "likes_count": post.likes.count()})

        return Response({"is_liked": True, "likes_count": post.likes.count()})


class RepostPostView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        target_post = resolve_target_post(get_object_or_404(Post, pk=pk, is_visible=True))

        existing = Post.objects.filter(
            author=request.user,
            original_post=target_post,
            is_repost=True,
            is_visible=True,
        ).first()

        if existing:
            existing.delete()
            return Response({
                "is_reposted": False,
                "reposts_count": Post.objects.filter(
                    original_post=target_post,
                    is_repost=True,
                    is_visible=True,
                ).count(),
            })

        Post.objects.create(
            author=request.user,
            content=request.data.get("content", "").strip(),
            is_repost=True,
            original_post=target_post,
            is_visible=True,
        )

        return Response({
            "is_reposted": True,
            "reposts_count": Post.objects.filter(
                original_post=target_post,
                is_repost=True,
                is_visible=True,
            ).count(),
        })
