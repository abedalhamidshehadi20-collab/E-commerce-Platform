import uuid
from decimal import Decimal

from django.conf import settings
from django.db import models
from django.db.models import Q
from django.utils import timezone
from django.utils.crypto import get_random_string


def generate_order_number():
    return f"ORD-{timezone.now():%Y%m%d}-{get_random_string(6).upper()}"


class Order(models.Model):
    class PaymentMethod(models.TextChoices):
        COD = "cod", "Cash on Delivery"
        CARD = "card", "Card"

    class PaymentStatus(models.TextChoices):
        UNPAID = "unpaid", "Unpaid"
        PENDING = "pending", "Pending"
        PAID = "paid", "Paid"
        FAILED = "failed", "Failed"
        CANCELED = "canceled", "Canceled"
        REFUNDED = "refunded", "Refunded"

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
    payment_method = models.CharField(
        max_length=20,
        choices=PaymentMethod.choices,
        default=PaymentMethod.COD,
    )
    payment_status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.UNPAID,
    )
    transaction_reference = models.CharField(max_length=255, blank=True)
    shipping_full_name = models.CharField(max_length=255)
    shipping_phone_number = models.CharField(max_length=20)
    shipping_line1 = models.CharField(max_length=255)
    shipping_line2 = models.CharField(max_length=255, blank=True)
    shipping_city = models.CharField(max_length=120)
    shipping_state = models.CharField(max_length=120)
    shipping_postal_code = models.CharField(max_length=20)
    shipping_country = models.CharField(max_length=120)
    notes = models.TextField(blank=True)
    coupon = models.ForeignKey(
        "coupons.Coupon",
        on_delete=models.SET_NULL,
        related_name="orders",
        null=True,
        blank=True,
    )
    coupon_code = models.CharField(max_length=50, blank=True)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    discount_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal("0.00"),
    )
    shipping_cost = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    payment_initiated_at = models.DateTimeField(null=True, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "orders"
        ordering = ("-created_at",)
        constraints = [
            models.CheckConstraint(check=Q(subtotal__gte=0), name="orders_subtotal_non_negative"),
            models.CheckConstraint(
                check=Q(discount_amount__gte=0),
                name="orders_discount_non_negative",
            ),
            models.CheckConstraint(
                check=Q(total_price__gte=0), name="orders_total_non_negative"
            ),
        ]
        indexes = [
            models.Index(fields=["user"], name="idx_orders_user"),
            models.Index(fields=["status"], name="idx_orders_status"),
            models.Index(fields=["payment_status"], name="idx_orders_payment_status"),
            models.Index(fields=["payment_method"], name="idx_orders_payment_method"),
            models.Index(fields=["created_at"], name="idx_orders_created"),
            models.Index(fields=["order_number"], name="idx_orders_number"),
            models.Index(fields=["transaction_reference"], name="idx_orders_txn_ref"),
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


class CheckoutSession(models.Model):
    class Provider(models.TextChoices):
        MOCK = "mock", "Mock"
        STRIPE = "stripe", "Stripe"

    class Status(models.TextChoices):
        INITIALIZED = "initialized", "Initialized"
        REQUIRES_PAYMENT_METHOD = "requires_payment_method", "Requires payment method"
        REQUIRES_ACTION = "requires_action", "Requires action"
        PROCESSING = "processing", "Processing"
        SUCCEEDED = "succeeded", "Succeeded"
        CANCELED = "canceled", "Canceled"
        COMPLETED = "completed", "Completed"

    public_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="checkout_sessions",
    )
    order = models.OneToOneField(
        Order,
        on_delete=models.SET_NULL,
        related_name="checkout_session",
        null=True,
        blank=True,
    )
    provider = models.CharField(max_length=20, choices=Provider.choices)
    payment_method = models.CharField(
        max_length=20,
        choices=Order.PaymentMethod.choices,
        default=Order.PaymentMethod.CARD,
    )
    status = models.CharField(
        max_length=40,
        choices=Status.choices,
        default=Status.INITIALIZED,
    )
    currency = models.CharField(max_length=10, default="usd")
    cart_signature = models.CharField(max_length=64)
    shipping_signature = models.CharField(max_length=64)
    shipping_snapshot = models.JSONField(default=dict)
    cart_snapshot = models.JSONField(default=list)
    coupon = models.ForeignKey(
        "coupons.Coupon",
        on_delete=models.SET_NULL,
        related_name="checkout_sessions",
        null=True,
        blank=True,
    )
    coupon_code = models.CharField(max_length=50, blank=True)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    discount_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal("0.00"),
    )
    shipping_cost = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    provider_payment_id = models.CharField(max_length=255, blank=True)
    idempotency_key = models.CharField(max_length=64, unique=True, default=uuid.uuid4)
    last_error_code = models.CharField(max_length=100, blank=True)
    last_error_message = models.CharField(max_length=255, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    payment_confirmed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "checkout_sessions"
        ordering = ("-created_at",)
        constraints = [
            models.CheckConstraint(
                check=Q(subtotal__gte=0),
                name="checkout_session_subtotal_non_negative",
            ),
            models.CheckConstraint(
                check=Q(discount_amount__gte=0),
                name="checkout_session_discount_non_negative",
            ),
            models.CheckConstraint(
                check=Q(total_price__gte=0),
                name="checkout_session_total_non_negative",
            ),
        ]
        indexes = [
            models.Index(fields=["user"], name="idx_checkout_session_user"),
            models.Index(fields=["status"], name="idx_checkout_session_status"),
            models.Index(fields=["provider"], name="idx_checkout_session_provider"),
            models.Index(
                fields=["provider_payment_id"],
                name="idx_checkout_pay_id",
            ),
            models.Index(fields=["cart_signature"], name="idx_checkout_session_cart"),
        ]

    def __str__(self):
        return f"{self.user_id}:{self.public_id}"
