from django.urls import path

from .views import (
    AcceptCallView,
    CallSignalView,
    ConversationListView,
    ConversationStartView,
    CurrentCallView,
    DeclineCallView,
    EndCallView,
    MessageDeleteView,
    MessageListCreateView,
    StartCallView,
    UnreadCountView,
)

urlpatterns = [
    path("conversations/", ConversationListView.as_view()),
    path("start/", ConversationStartView.as_view()),
    path("conversations/<uuid:conv_id>/messages/", MessageListCreateView.as_view()),
    path("conversations/<uuid:conv_id>/calls/current/", CurrentCallView.as_view()),
    path("conversations/<uuid:conv_id>/calls/start/", StartCallView.as_view()),
    path("calls/<uuid:call_id>/signal/", CallSignalView.as_view()),
    path("calls/<uuid:call_id>/accept/", AcceptCallView.as_view()),
    path("calls/<uuid:call_id>/decline/", DeclineCallView.as_view()),
    path("calls/<uuid:call_id>/end/", EndCallView.as_view()),
    path("messages/<uuid:msg_id>/delete/", MessageDeleteView.as_view()),
    path("unread/", UnreadCountView.as_view()),
]
