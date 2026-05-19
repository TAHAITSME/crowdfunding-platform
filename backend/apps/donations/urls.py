from django.urls import path
from .views import (
    ConfirmCheckoutSessionView,
    CreateCheckoutSessionView,
    DonationHistoryView,
    SyncPaidDonationsView,
    StripeWebhookView,
)

urlpatterns = [
    path("checkout/", CreateCheckoutSessionView.as_view(), name="donation-checkout"),
    path("confirm/", ConfirmCheckoutSessionView.as_view(), name="donation-confirm"),
    path("sync-paid/", SyncPaidDonationsView.as_view(), name="donation-sync-paid"),
    path("webhook/", StripeWebhookView.as_view(), name="stripe-webhook"),
    path("history/", DonationHistoryView.as_view(), name="donation-history"),
]
