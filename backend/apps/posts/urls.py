from django.urls import path
from .views import (
    PostListCreateView,
    PostDetailView,
    SavePostView,
    SavedPostListView,
    LikePostView,
    RepostPostView,
)

urlpatterns = [
    path("posts/", PostListCreateView.as_view(), name="post-list"),
    path("posts/saved/", SavedPostListView.as_view(), name="saved-posts"),
    path("posts/<uuid:pk>/", PostDetailView.as_view(), name="post-detail"),
    path("posts/<uuid:pk>/save/", SavePostView.as_view(), name="post-save"),
    path("posts/<uuid:pk>/like/", LikePostView.as_view(), name="post-like"),
    path("posts/<uuid:pk>/repost/", RepostPostView.as_view(), name="post-repost"),
]
