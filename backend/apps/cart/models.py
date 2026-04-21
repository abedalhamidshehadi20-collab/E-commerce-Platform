from decimal import Decimal

from django.conf import settings
from django.db import models
from django.db.models import Q, Sum


class Cart(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="cart"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "cart"
        indexes = [models.Index(fields=["user"], name="idx_cart_user")]

    def __str__(self):
        return f"Cart for {self.user.email}"

    @property
    def total_items(self):
        return self.items.aggregate(total=Sum("quantity"))["total"] or 0

    @property
    def subtotal(self):
        total = Decimal("0.00")
        for item in self.items.select_related("product"):
            total += item.line_total
        return total


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(
        "products.Product", on_delete=models.CASCADE, related_name="cart_items"
    )
    quantity = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "cart_items"
        unique_together = ("cart", "product")
        constraints = [
            models.CheckConstraint(check=Q(quantity__gt=0), name="cart_items_qty_positive")
        ]
        indexes = [
            models.Index(fields=["cart"], name="idx_cart_items_cart"),
            models.Index(fields=["product"], name="idx_cart_items_product"),
        ]

    def __str__(self):
        return f"{self.product.name} x {self.quantity}"

    @property
    def line_total(self):
        return self.product.price * self.quantity
