from django.contrib import admin
from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('recipient', 'sender', 'type', 'is_read', 'created_at')
    list_filter = ('type', 'is_read', 'created_at')
    search_fields = ('recipient__username', 'sender__username', 'title')
    readonly_fields = ('id', 'created_at')
    
    fieldsets = (
        ('Notification Info', {
            'fields': ('id', 'recipient', 'sender', 'type', 'title', 'message', 'created_at')
        }),
        ('Status', {
            'fields': ('is_read',)
        }),
    )
