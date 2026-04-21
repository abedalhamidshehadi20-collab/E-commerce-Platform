from django.urls import path

from .views import CartAddView, CartRemoveView, CartUpdateView, CartView


urlpatterns = [
    path("cart", CartView.as_view(), name="cart-detail"),
    path("cart/add", CartAddView.as_view(), name="cart-add"),
    path("cart/update", CartUpdateView.as_view(), name="cart-update"),
    path("cart/remove", CartRemoveView.as_view(), name="cart-remove"),
]
