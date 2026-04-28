from decimal import Decimal

from django.conf import settings
from django.db import models
from django.db.models import Q
from django.utils import timezone


class Coupon(models.Model):
    class DiscountType(models.TextChoices):
        PERCENT = "percent", "Percent"
        FIXED = "fixed", "Fixed"

    code = models.CharField(max_length=50)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="coupons",
    )
    discount_type = models.CharField(
        max_length=10,
        choices=DiscountType.choices,
        default=DiscountType.PERCENT,
    )
    discount_value = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal("0.00"),
    )
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    used_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "coupons"
        ordering = ("used", "expires_at", "-created_at")
        constraints = [
            models.UniqueConstraint(fields=["user", "code"], name="uniq_coupon_user_code"),
            models.CheckConstraint(
                check=Q(discount_value__gt=0),
                name="coupon_discount_positive",
            ),
        ]
        indexes = [
            models.Index(fields=["user"], name="idx_coupons_user"),
            models.Index(fields=["code"], name="idx_coupons_code"),
            models.Index(fields=["used"], name="idx_coupons_used"),
            models.Index(fields=["expires_at"], name="idx_coupons_expires"),
        ]

    def __str__(self):
        return f"{self.code} ({self.user.email})"

    @property
    def is_expired(self):
        return self.expires_at <= timezone.now()

    def save(self, *args, **kwargs):
        self.code = str(self.code or "").strip().upper()
        super().save(*args, **kwargs)
