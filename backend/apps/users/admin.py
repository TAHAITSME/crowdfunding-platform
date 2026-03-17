from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display  = ['username', 'email', 'role', 'is_verified', 'created_at']
    list_filter   = ['role', 'is_verified']
    search_fields = ['username', 'email']
    ordering      = ['-created_at']

    # Ajouter nos champs personnalisés dans le formulaire admin
    fieldsets = UserAdmin.fieldsets + (
        ('Informations supplémentaires', {
            'fields': ('role', 'phone', 'cin', 'bio', 'avatar', 'is_verified', 'dark_mode')
        }),
    )
