from django.contrib import admin

from .models import Friendship


@admin.register(Friendship)
class FriendshipAdmin(admin.ModelAdmin):
    list_display = ("requester", "addressee", "status", "created_at", "updated_at")
    list_filter = ("status", "created_at")
    search_fields = ("requester__username", "requester__email", "addressee__username", "addressee__email")
