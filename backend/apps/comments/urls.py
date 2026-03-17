from django.urls import path
from .views import CommentListCreateView, CommentDetailView

urlpatterns = [
    path('posts/<uuid:pk>/comments/',       CommentListCreateView.as_view(), name='comment-list'),
    path('comments/<uuid:pk>/',             CommentDetailView.as_view(),     name='comment-detail'),
]
