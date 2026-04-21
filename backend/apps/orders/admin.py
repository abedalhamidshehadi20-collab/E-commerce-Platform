from django.contrib import admin

from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ("product", "product_name", "quantity", "price_at_purchase", "line_total")


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("order_number", "user", "status", "total_price", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("order_number", "user__email", "shipping_full_name")
    readonly_fields = ("subtotal", "total_price", "created_at", "updated_at")
    inlines = [OrderItemInline]


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ("order", "product_name", "quantity", "price_at_purchase", "line_total")
    search_fields = ("order__order_number", "product_name")
