from django.contrib import admin
from .models import Association

@admin.register(Association)
class AssociationAdmin(admin.ModelAdmin):
    list_display   = ['name', 'user', 'is_approved', 'total_collected', 'created_at']
    list_filter    = ['is_approved']
    search_fields  = ['name', 'user__email']
    actions        = ['approve_associations']

    def approve_associations(self, request, queryset):
        queryset.update(is_approved=True)
        self.message_user(request, "Associations approuvées ✅")
    approve_associations.short_description = "Approuver les associations sélectionnées"
