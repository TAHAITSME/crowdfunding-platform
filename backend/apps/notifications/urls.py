from django.urls import path
from .views import NotificationListView, UnreadCountView

urlpatterns = [
    path('notifications/',        NotificationListView.as_view(), name='notification-list'),
    path('notifications/unread/', UnreadCountView.as_view(),      name='notification-unread'),
]
