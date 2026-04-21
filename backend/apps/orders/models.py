from decimal import Decimal

from django.conf import settings
from django.db import models
from django.db.models import Q
from django.utils.crypto import get_random_string
from django.utils import timezone


def generate_order_number():
    return f"ORD-{timezone.now():%Y%m%d}-{get_random_string(6).upper()}"


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PROCESSING = "processing", "Processing"
        SHIPPED = "shipped", "Shipped"
        DELIVERED = "delivered", "Delivered"
        CANCELLED = "cancelled", "Cancelled"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="orders"
    )
    address = models.ForeignKey(
        "users.Address",
        on_delete=models.PROTECT,
        related_name="orders",
        null=True,
        blank=True,
    )
    order_number = models.CharField(max_length=40, unique=True, default=generate_order_number)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    shipping_full_name = models.CharField(max_length=255)
    shipping_phone_number = models.CharField(max_length=20)
    shipping_line1 = models.CharField(max_length=255)
    shipping_line2 = models.CharField(max_length=255, blank=True)
    shipping_city = models.CharField(max_length=120)
    shipping_state = models.CharField(max_length=120)
    shipping_postal_code = models.CharField(max_length=20)
    shipping_country = models.CharField(max_length=120)
    notes = models.TextField(blank=True)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    shipping_cost = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "orders"
        ordering = ("-created_at",)
        constraints = [
            models.CheckConstraint(check=Q(subtotal__gte=0), name="orders_subtotal_non_negative"),
            models.CheckConstraint(
                check=Q(total_price__gte=0), name="orders_total_non_negative"
            ),
        ]
        indexes = [
            models.Index(fields=["user"], name="idx_orders_user"),
            models.Index(fields=["status"], name="idx_orders_status"),
            models.Index(fields=["created_at"], name="idx_orders_created"),
            models.Index(fields=["order_number"], name="idx_orders_number"),
        ]

    def __str__(self):
        return self.order_number

    def save(self, *args, **kwargs):
        if not self.order_number:
            self.order_number = generate_order_number()
        super().save(*args, **kwargs)


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(
        "products.Product", on_delete=models.PROTECT, related_name="order_items"
    )
    product_name = models.CharField(max_length=255)
    quantity = models.PositiveIntegerField()
    price_at_purchase = models.DecimalField(max_digits=10, decimal_places=2)
    line_total = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = "order_items"
        indexes = [
            models.Index(fields=["order"], name="idx_order_items_order"),
            models.Index(fields=["product"], name="idx_order_items_product"),
        ]
        constraints = [
            models.CheckConstraint(check=Q(quantity__gt=0), name="order_item_qty_positive"),
            models.CheckConstraint(
                check=Q(price_at_purchase__gte=0),
                name="order_item_price_non_negative",
            ),
        ]

    def __str__(self):
        return f"{self.product_name} x {self.quantity}"
