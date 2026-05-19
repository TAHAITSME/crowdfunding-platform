from django.urls import path

from .views import (
    FriendshipAcceptView,
    FriendshipListView,
    FriendshipRejectView,
    FriendshipRemoveView,
    FriendshipRequestListView,
    FriendshipSendView,
    FriendshipStatusView,
    UserFriendshipListView,
)

urlpatterns = [
    path("friends/", FriendshipListView.as_view(), name="friends-list"),
    path("friends/requests/", FriendshipRequestListView.as_view(), name="friends-requests"),
    path("friends/request/", FriendshipSendView.as_view(), name="friends-request"),
    path("friends/requests/<uuid:pk>/accept/", FriendshipAcceptView.as_view(), name="friends-accept"),
    path("friends/requests/<uuid:pk>/reject/", FriendshipRejectView.as_view(), name="friends-reject"),
    path("friends/<uuid:pk>/", FriendshipRemoveView.as_view(), name="friends-remove"),
    path("friends/status/<uuid:user_id>/", FriendshipStatusView.as_view(), name="friends-status"),
    path("users/<uuid:user_id>/friends/", UserFriendshipListView.as_view(), name="user-friends-list"),
]
