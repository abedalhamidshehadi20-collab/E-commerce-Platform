from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Coupon
from .services import WELCOME_COUPON_CODE, get_welcome_coupon_defaults

User = get_user_model()


@receiver(post_save, sender=User)
def create_welcome_coupon(sender, instance, created, **kwargs):
    if not created:
        return

    Coupon.objects.get_or_create(
        user=instance,
        code=WELCOME_COUPON_CODE,
        defaults=get_welcome_coupon_defaults(instance.date_joined),
    )
