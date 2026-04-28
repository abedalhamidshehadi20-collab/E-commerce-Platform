from django.contrib import admin

from .models import CheckoutSession, Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ("product", "product_name", "quantity", "price_at_purchase", "line_total")


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "order_number",
        "user",
        "status",
        "payment_method",
        "payment_status",
        "coupon_code",
        "total_price",
        "created_at",
    )
    list_filter = ("status", "payment_method", "payment_status", "coupon_code", "created_at")
    search_fields = (
        "order_number",
        "transaction_reference",
        "user__email",
        "shipping_full_name",
    )
    readonly_fields = (
        "coupon",
        "coupon_code",
        "discount_amount",
        "subtotal",
        "total_price",
        "transaction_reference",
        "payment_initiated_at",
        "paid_at",
        "created_at",
        "updated_at",
    )
    inlines = [OrderItemInline]


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ("order", "product_name", "quantity", "price_at_purchase", "line_total")
    search_fields = ("order__order_number", "product_name")


@admin.register(CheckoutSession)
class CheckoutSessionAdmin(admin.ModelAdmin):
    list_display = (
        "public_id",
        "user",
        "provider",
        "status",
        "coupon_code",
        "total_price",
        "provider_payment_id",
        "created_at",
    )
    list_filter = ("provider", "status", "created_at")
    search_fields = ("public_id", "provider_payment_id", "user__email")
    readonly_fields = (
        "public_id",
        "cart_signature",
        "shipping_signature",
        "shipping_snapshot",
        "cart_snapshot",
        "coupon",
        "coupon_code",
        "discount_amount",
        "provider_payment_id",
        "last_error_code",
        "last_error_message",
        "expires_at",
        "payment_confirmed_at",
        "created_at",
        "updated_at",
    )
