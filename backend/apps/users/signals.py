from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.cart.models import Cart

User = get_user_model()


@receiver(post_save, sender=User)
def ensure_cart_exists(sender, instance, created, **kwargs):
    if created:
        Cart.objects.get_or_create(user=instance)
