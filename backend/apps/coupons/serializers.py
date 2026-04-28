from decimal import Decimal

from rest_framework import serializers

from .models import Coupon
from .services import normalize_coupon_code


def format_decimal(value):
    normalized = Decimal(value).normalize()
    return format(normalized, "f").rstrip("0").rstrip(".") or "0"


class CouponSerializer(serializers.ModelSerializer):
    is_expired = serializers.BooleanField(read_only=True)
    status = serializers.SerializerMethodField()
    discount_label = serializers.SerializerMethodField()

    class Meta:
        model = Coupon
        fields = [
            "id",
            "code",
            "discount_type",
            "discount_value",
            "discount_label",
            "expires_at",
            "used",
            "used_at",
            "is_expired",
            "status",
            "created_at",
        ]

    def get_status(self, obj):
        if obj.used:
            return "Used"
        if obj.is_expired:
            return "Expired"
        return "Available"

    def get_discount_label(self, obj):
        value = format_decimal(obj.discount_value)
        if obj.discount_type == Coupon.DiscountType.PERCENT:
            return f"{value}% OFF"
        return f"${value} OFF"


class ApplyCouponSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=50)
    cart_total = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=Decimal("0.01"),
    )

    def validate_code(self, value):
        normalized = normalize_coupon_code(value)
        if not normalized:
            raise serializers.ValidationError("Enter a coupon code.")
        return normalized
