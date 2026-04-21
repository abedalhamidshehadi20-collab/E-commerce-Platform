from decimal import Decimal

from django.db import transaction
from rest_framework import serializers

from apps.cart.models import Cart, CartItem
from apps.products.models import Product
from apps.users.models import Address

from .models import Order, OrderItem


@transaction.atomic
def create_order_from_cart(user, payload):
    cart, _ = Cart.objects.select_for_update().get_or_create(user=user)
    cart_items = list(CartItem.objects.select_related("product").filter(cart=cart))

    if not cart_items:
        raise serializers.ValidationError("Your cart is empty.")

    locked_products = {
        product.id: product
        for product in Product.objects.select_for_update().filter(
            id__in=[item.product_id for item in cart_items]
        )
    }

    for item in cart_items:
        product = locked_products[item.product_id]
        if item.quantity > product.stock:
            raise serializers.ValidationError(
                {
                    "stock": (
                        f"Only {product.stock} item(s) available for "
                        f"'{product.name}'."
                    )
                }
            )

    address = payload.get("address")
    if address is None and payload.get("save_address"):
        address = Address.objects.create(
            user=user,
            label=payload.get("label", ""),
            full_name=payload["full_name"],
            phone_number=payload["phone_number"],
            line1=payload["line1"],
            line2=payload.get("line2", ""),
            city=payload["city"],
            state=payload["state"],
            postal_code=payload["postal_code"],
            country=payload["country"],
            is_default=False,
        )

    shipping_source = address or payload
    order = Order.objects.create(
        user=user,
        address=address,
        shipping_full_name=shipping_source.full_name if address else payload["full_name"],
        shipping_phone_number=shipping_source.phone_number
        if address
        else payload["phone_number"],
        shipping_line1=shipping_source.line1 if address else payload["line1"],
        shipping_line2=shipping_source.line2 if address else payload.get("line2", ""),
        shipping_city=shipping_source.city if address else payload["city"],
        shipping_state=shipping_source.state if address else payload["state"],
        shipping_postal_code=shipping_source.postal_code
        if address
        else payload["postal_code"],
        shipping_country=shipping_source.country if address else payload["country"],
        notes=payload.get("notes", ""),
        shipping_cost=Decimal("0.00"),
    )

    subtotal = Decimal("0.00")
    order_items = []
    for item in cart_items:
        product = locked_products[item.product_id]
        unit_price = product.price
        line_total = unit_price * item.quantity
        subtotal += line_total
        order_items.append(
            OrderItem(
                order=order,
                product=product,
                product_name=product.name,
                quantity=item.quantity,
                price_at_purchase=unit_price,
                line_total=line_total,
            )
        )
        product.stock -= item.quantity
        product.save(update_fields=["stock", "updated_at"])

    OrderItem.objects.bulk_create(order_items)
    order.subtotal = subtotal
    order.total_price = subtotal + order.shipping_cost
    order.save(update_fields=["subtotal", "total_price", "updated_at"])

    CartItem.objects.filter(cart=cart).delete()
    return order
