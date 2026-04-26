from django.conf import settings
from django.db import models


class Wishlist(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="wishlist"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "wishlist"
        ordering = ("-created_at",)
        indexes = [models.Index(fields=["user"], name="idx_wishlist_user")]

    def __str__(self):
        return f"Wishlist for {self.user.email}"

    @property
    def total_items(self):
        return self.items.count()


class WishlistItem(models.Model):
    wishlist = models.ForeignKey(Wishlist, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(
        "products.Product", on_delete=models.CASCADE, related_name="wishlist_items"
    )
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "wishlist_items"
        ordering = ("-added_at",)
        constraints = [
            models.UniqueConstraint(
                fields=["wishlist", "product"], name="unique_wishlist_product"
            )
        ]
        indexes = [
            models.Index(fields=["wishlist"], name="idx_wishlist_items_wishlist"),
            models.Index(fields=["product"], name="idx_wishlist_items_product"),
        ]

    def __str__(self):
        return f"{self.product.name} in {self.wishlist.user.email}'s wishlist"
