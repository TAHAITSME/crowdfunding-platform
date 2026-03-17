from django.contrib import admin
from .models import Post, SavedPost

@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display  = ['author', 'post_type', 'is_visible', 'views_count', 'created_at']
    list_filter   = ['post_type', 'is_visible']
    search_fields = ['author__username', 'content']
