from django.contrib import admin
from .models import Donation

@admin.register(Donation)
class DonationAdmin(admin.ModelAdmin):
    list_display  = ['donor', 'campaign', 'amount', 'commission_amount',
                     'net_amount', 'status', 'is_anonymous', 'created_at']
    list_filter   = ['status', 'is_anonymous']
    search_fields = ['donor__username', 'campaign__title']
