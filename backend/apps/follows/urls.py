from django.urls import path
from .views import (
    FollowToggleView,
    IsFollowingView, 
    FollowersListView,
    FollowingListView,
    SuggestionsView
)

urlpatterns = [
    # Follow/Unfollow toggle
    path('users/<uuid:user_id>/follow/', FollowToggleView.as_view(), name='follow-toggle'),
    
    # Check if following
    path('users/<uuid:user_id>/is_following/', IsFollowingView.as_view(), name='is-following'),
    
    # List followers of a user
    path('users/<uuid:user_id>/followers/', FollowersListView.as_view(), name='followers-list'),
    
    # List users that a user is following
    path('users/<uuid:user_id>/following/', FollowingListView.as_view(), name='following-list'),
    
    # Suggestions of users to follow
    path('users/suggestions/', SuggestionsView.as_view(), name='suggestions'),
]
