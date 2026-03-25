from django.urls import path
from .views import (
    ConversationListView,
    ConversationStartView,
    MessageListView,
    MessageSendView,
)

urlpatterns = [
    path('conversations/',                          ConversationListView.as_view()),
    path('start/',                                  ConversationStartView.as_view()),
    path('conversations/<uuid:conv_id>/messages/',  MessageListView.as_view()),
    path('conversations/<uuid:conv_id>/send/',      MessageSendView.as_view()),
]
