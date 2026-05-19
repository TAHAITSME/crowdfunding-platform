from django.urls import path
from .views import (
    CommentDetailView,
    CommentHideView,
    CommentListCreateView,
    CommentReactionToggleView,
)

urlpatterns = [
    path('posts/<uuid:pk>/comments/',       CommentListCreateView.as_view(), name='comment-list'),
    path('posts/<uuid:post_pk>/comments/<uuid:comment_pk>/hide/', CommentHideView.as_view(), name='comment-hide'),
    path('comments/<uuid:pk>/',             CommentDetailView.as_view(),     name='comment-detail'),
    path('comments/<uuid:pk>/react/',       CommentReactionToggleView.as_view(), name='comment-react'),
]
