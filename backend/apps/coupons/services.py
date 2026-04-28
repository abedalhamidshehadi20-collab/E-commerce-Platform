from dataclasses import dataclass
from datetime import timedelta
from decimal import Decimal, ROUND_HALF_UP

from django.utils import timezone
from rest_framework import serializers

from .models import Coupon

WELCOME_COUPON_CODE = "SAVE20"
WELCOME_COUPON_DISCOUNT_VALUE = Decimal("20.00")
ZERO_DECIMAL = Decimal("0.00")
MONEY_QUANTIZER = Decimal("0.01")


@dataclass
class CouponApplication:
    coupon: Coupon
    cart_total: Decimal
    discount: Decimal
    final_price: Decimal


def normalize_coupon_code(code):
    return str(code or "").strip().upper()


def get_welcome_coupon_defaults(base_datetime):
    return {
        "discount_type": Coupon.DiscountType.PERCENT,
        "discount_value": WELCOME_COUPON_DISCOUNT_VALUE,
        "expires_at": base_datetime + timedelta(days=90),
    }


def to_money(value):
    return Decimal(value).quantize(MONEY_QUANTIZER, rounding=ROUND_HALF_UP)


def _raise_coupon_error(message):
    raise serializers.ValidationError({"code": message})


def get_coupon_for_user(user, code):
    normalized_code = normalize_coupon_code(code)
    try:
        return Coupon.objects.get(user=user, code=normalized_code)
    except Coupon.DoesNotExist as exc:
        raise serializers.ValidationError(
            {"code": "Coupon not found for this account."}
        ) from exc


def apply_coupon_to_total(coupon, cart_total):
    cart_total = to_money(cart_total)

    if coupon.discount_type == Coupon.DiscountType.PERCENT:
        raw_discount = cart_total * coupon.discount_value / Decimal("100")
    else:
        raw_discount = coupon.discount_value

    discount = min(to_money(raw_discount), cart_total)
    final_price = max(cart_total - discount, ZERO_DECIMAL)
    return discount, to_money(final_price)


def validate_coupon_for_user(user, code, cart_total):
    coupon = get_coupon_for_user(user, code)

    if coupon.used:
        _raise_coupon_error("This coupon has already been used.")
    if coupon.is_expired:
        _raise_coupon_error("This coupon has expired.")

    discount, final_price = apply_coupon_to_total(coupon, cart_total)
    return CouponApplication(
        coupon=coupon,
        cart_total=to_money(cart_total),
        discount=discount,
        final_price=final_price,
    )


def mark_coupon_used(coupon):
    if coupon is None or coupon.used:
        return coupon

    coupon.used = True
    coupon.used_at = timezone.now()
    coupon.save(update_fields=["used", "used_at", "updated_at"])
    return coupon
