# backend/apps/messaging/urls.py
from django.urls import path
from .views import (
    ConversationListView,
    ConversationStartView,
    MessageListCreateView,
    MessageDeleteView,
    UnreadCountView,
)

urlpatterns = [
    # ── Conversations ──
    path('conversations/',
         ConversationListView.as_view()),

    path('start/',
         ConversationStartView.as_view()),

    # ── Messages GET + POST ──  ✅ une seule route RESTful
    path('conversations/<uuid:conv_id>/messages/',
         MessageListCreateView.as_view()),

    # ── Supprimer un message ──
    path('messages/<uuid:msg_id>/delete/',
         MessageDeleteView.as_view()),

    # ── Badge non lus ──
    path('unread/',
         UnreadCountView.as_view()),
]
