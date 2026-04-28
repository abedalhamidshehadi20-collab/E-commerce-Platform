from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Coupon
from .services import WELCOME_COUPON_CODE

User = get_user_model()


class CouponTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="coupon-owner@example.com",
            username="coupon-owner",
            password="strong-password-123",
        )
        self.coupon = Coupon.objects.get(user=self.user, code=WELCOME_COUPON_CODE)

    def test_new_user_gets_a_welcome_coupon(self):
        self.assertEqual(self.coupon.code, "SAVE20")
        self.assertEqual(self.coupon.discount_type, Coupon.DiscountType.PERCENT)
        self.assertEqual(self.coupon.discount_value, Decimal("20.00"))
        self.assertFalse(self.coupon.used)
        self.assertEqual(
            self.coupon.expires_at,
            self.user.date_joined + timedelta(days=90),
        )

    def test_apply_coupon_endpoint_returns_discount_for_owner(self):
        self.client.force_authenticate(self.user)

        response = self.client.post(
            reverse("coupon-apply"),
            {
                "code": "save20",
                "cart_total": "120.00",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["code"], "SAVE20")
        self.assertEqual(response.data["discount"], Decimal("24.00"))
        self.assertEqual(response.data["final_price"], Decimal("96.00"))

    def test_apply_coupon_endpoint_rejects_wrong_owner(self):
        other_user = User.objects.create_user(
            email="another-shopper@example.com",
            username="another-shopper",
            password="strong-password-123",
        )
        Coupon.objects.create(
            user=self.user,
            code="VIP50",
            discount_type=Coupon.DiscountType.FIXED,
            discount_value=Decimal("50.00"),
            expires_at=timezone.now() + timedelta(days=14),
        )
        self.client.force_authenticate(other_user)

        response = self.client.post(
            reverse("coupon-apply"),
            {
                "code": "VIP50",
                "cart_total": "120.00",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data["errors"]["code"],
            "Coupon not found for this account.",
        )

    def test_apply_coupon_endpoint_rejects_expired_coupon(self):
        self.client.force_authenticate(self.user)
        self.coupon.expires_at = timezone.now() - timedelta(days=1)
        self.coupon.save(update_fields=["expires_at", "updated_at"])

        response = self.client.post(
            reverse("coupon-apply"),
            {
                "code": "SAVE20",
                "cart_total": "120.00",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["errors"]["code"], "This coupon has expired.")
