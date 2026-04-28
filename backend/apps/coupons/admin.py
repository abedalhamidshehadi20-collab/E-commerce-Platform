from django.contrib import admin

from .models import Coupon


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = (
        "code",
        "user",
        "discount_type",
        "discount_value",
        "used",
        "expires_at",
        "created_at",
    )
    list_filter = ("discount_type", "used", "expires_at", "created_at")
    search_fields = ("code", "user__email", "user__username")
    readonly_fields = ("used_at", "created_at", "updated_at")
