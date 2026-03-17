from django.contrib import admin
from .models import Campaign

@admin.register(Campaign)
class CampaignAdmin(admin.ModelAdmin):
    list_display  = ['title', 'association', 'category', 'goal_amount',
                     'current_amount', 'is_active', 'deadline']
    list_filter   = ['category', 'is_active']
    search_fields = ['title', 'association__name']
