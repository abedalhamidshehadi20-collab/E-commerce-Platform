from django.urls import path

from .views import WishlistAddView, WishlistClearView, WishlistRemoveView, WishlistView


urlpatterns = [
    path("wishlist/", WishlistView.as_view(), name="wishlist-detail"),
    path("wishlist/add/", WishlistAddView.as_view(), name="wishlist-add"),
    path("wishlist/remove/<int:product_id>/", WishlistRemoveView.as_view(), name="wishlist-remove"),
    path("wishlist/clear/", WishlistClearView.as_view(), name="wishlist-clear"),
]
