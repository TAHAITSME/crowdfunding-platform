from django.urls import path
from .views import (
    NotificationListView,
    UnreadCountView,
    MarkAsReadView,
    MarkAllAsReadView
)

urlpatterns = [
    path('notifications/', NotificationListView.as_view(), name='notification-list'),
    path('notifications/unread/', UnreadCountView.as_view(), name='notification-unread'),
    path('notifications/<uuid:notification_id>/read/', MarkAsReadView.as_view(), name='notification-mark-read'),
    path('notifications/read-all/', MarkAllAsReadView.as_view(), name='notification-read-all'),
]
