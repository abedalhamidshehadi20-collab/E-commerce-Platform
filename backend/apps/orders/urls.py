from django.urls import path

from .views import (
    CheckoutAPIView,
    OrderDetailAPIView,
    OrderListAPIView,
    PaymentSessionConfirmAPIView,
    PaymentSessionCreateAPIView,
    stripe_webhook_view,
)


urlpatterns = [
    path("orders/checkout", CheckoutAPIView.as_view(), name="order-checkout"),
    path(
        "orders/payment-sessions",
        PaymentSessionCreateAPIView.as_view(),
        name="order-payment-session-create",
    ),
    path(
        "orders/payment-sessions/confirm",
        PaymentSessionConfirmAPIView.as_view(),
        name="order-payment-session-confirm",
    ),
    path(
        "orders/payments/webhook",
        stripe_webhook_view,
        name="order-payment-webhook",
    ),
    path("orders", OrderListAPIView.as_view(), name="order-list"),
    path("orders/<int:pk>", OrderDetailAPIView.as_view(), name="order-detail"),
]
