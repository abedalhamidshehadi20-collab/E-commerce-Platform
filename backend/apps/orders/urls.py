from django.urls import path

from .views import CheckoutAPIView, OrderDetailAPIView, OrderListAPIView


urlpatterns = [
    path("orders/checkout", CheckoutAPIView.as_view(), name="order-checkout"),
    path("orders", OrderListAPIView.as_view(), name="order-list"),
    path("orders/<int:pk>", OrderDetailAPIView.as_view(), name="order-detail"),
]
