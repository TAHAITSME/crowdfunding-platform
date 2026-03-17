from django.urls import path
from .views import ReactToPostView, PostReactionsListView

urlpatterns = [
    path('posts/<uuid:pk>/react/',      ReactToPostView.as_view(),      name='post-react'),
    path('posts/<uuid:pk>/reactions/',  PostReactionsListView.as_view(), name='post-reactions'),
]
