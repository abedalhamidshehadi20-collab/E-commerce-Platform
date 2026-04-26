import hashlib
import json
from dataclasses import dataclass
from datetime import timedelta
from decimal import Decimal

from django.conf import settings
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from apps.cart.models import Cart, CartItem
from apps.products.models import Product
from apps.users.models import Address

from .gateways import PaymentGatewayError, get_payment_gateway
from .models import CheckoutSession, Order, OrderItem

ZERO_DECIMAL = Decimal("0.00")
ACTIVE_PAYMENT_SESSION_STATUSES = (
    CheckoutSession.Status.INITIALIZED,
    CheckoutSession.Status.REQUIRES_PAYMENT_METHOD,
    CheckoutSession.Status.REQUIRES_ACTION,
    CheckoutSession.Status.PROCESSING,
)


@dataclass
class CheckoutSnapshot:
    cart: Cart
    cart_items: list
    cart_snapshot: list
    subtotal: Decimal
    shipping_cost: Decimal
    total_price: Decimal


class InventoryConflictError(Exception):
    def __init__(self, public_message):
        super().__init__(public_message)
        self.public_message = public_message


def _serialize_signature(payload):
    return hashlib.sha256(
        json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
    ).hexdigest()


def _build_shipping_snapshot(user, payload):
    address = payload.get("address")
    if address is not None:
        return {
            "address_id": address.id,
            "save_address": False,
            "label": address.label or "",
            "full_name": address.full_name,
            "phone_number": address.phone_number,
            "line1": address.line1,
            "line2": address.line2,
            "city": address.city,
            "state": address.state,
            "postal_code": address.postal_code,
            "country": address.country,
            "notes": payload.get("notes", ""),
        }

    return {
        "address_id": None,
        "save_address": bool(payload.get("save_address")),
        "label": payload.get("label", ""),
        "full_name": payload["full_name"],
        "phone_number": payload["phone_number"],
        "line1": payload["line1"],
        "line2": payload.get("line2", ""),
        "city": payload["city"],
        "state": payload["state"],
        "postal_code": payload["postal_code"],
        "country": payload["country"],
        "notes": payload.get("notes", ""),
    }


def _build_cart_snapshot(user):
    cart, _ = Cart.objects.get_or_create(user=user)
    cart_items = list(CartItem.objects.select_related("product").filter(cart=cart))

    if not cart_items:
        raise serializers.ValidationError("Your cart is empty.")

    cart_snapshot = []
    subtotal = ZERO_DECIMAL
    for item in cart_items:
        product = item.product
        if item.quantity > product.stock:
            raise serializers.ValidationError(
                {
                    "stock": (
                        f"Only {product.stock} item(s) available for "
                        f"'{product.name}'."
                    )
                }
            )

        line_total = product.price * item.quantity
        subtotal += line_total
        cart_snapshot.append(
            {
                "product_id": product.id,
                "product_name": product.name,
                "quantity": item.quantity,
                "unit_price": str(product.price),
                "line_total": str(line_total),
            }
        )

    shipping_cost = ZERO_DECIMAL
    return CheckoutSnapshot(
        cart=cart,
        cart_items=cart_items,
        cart_snapshot=cart_snapshot,
        subtotal=subtotal,
        shipping_cost=shipping_cost,
        total_price=subtotal + shipping_cost,
    )


def _resolve_order_address(user, shipping_snapshot):
    address_id = shipping_snapshot.get("address_id")
    if address_id:
        return Address.objects.filter(pk=address_id, user=user).first()

    if not shipping_snapshot.get("save_address"):
        return None

    return Address.objects.create(
        user=user,
        label=shipping_snapshot.get("label", ""),
        full_name=shipping_snapshot["full_name"],
        phone_number=shipping_snapshot["phone_number"],
        line1=shipping_snapshot["line1"],
        line2=shipping_snapshot.get("line2", ""),
        city=shipping_snapshot["city"],
        state=shipping_snapshot["state"],
        postal_code=shipping_snapshot["postal_code"],
        country=shipping_snapshot["country"],
        is_default=False,
    )


def _lock_products_for_snapshot(cart_snapshot):
    locked_products = {
        product.id: product
        for product in Product.objects.select_for_update().filter(
            id__in=[item["product_id"] for item in cart_snapshot]
        )
    }

    for item in cart_snapshot:
        product = locked_products.get(item["product_id"])
        if product is None:
            raise InventoryConflictError(
                "One or more products are no longer available. Please review your cart."
            )
        if int(item["quantity"]) > product.stock:
            raise InventoryConflictError(
                f"Only {product.stock} item(s) available for '{product.name}'."
            )

    return locked_products


def _create_order_from_snapshot(
    *,
    user,
    shipping_snapshot,
    cart_snapshot,
    payment_method,
    payment_status,
    transaction_reference="",
    payment_initiated_at=None,
    paid_at=None,
):
    address = _resolve_order_address(user, shipping_snapshot)
    locked_products = _lock_products_for_snapshot(cart_snapshot)

    order = Order.objects.create(
        user=user,
        address=address,
        status=Order.Status.PENDING,
        payment_method=payment_method,
        payment_status=payment_status,
        transaction_reference=transaction_reference,
        shipping_full_name=shipping_snapshot["full_name"],
        shipping_phone_number=shipping_snapshot["phone_number"],
        shipping_line1=shipping_snapshot["line1"],
        shipping_line2=shipping_snapshot.get("line2", ""),
        shipping_city=shipping_snapshot["city"],
        shipping_state=shipping_snapshot["state"],
        shipping_postal_code=shipping_snapshot["postal_code"],
        shipping_country=shipping_snapshot["country"],
        notes=shipping_snapshot.get("notes", ""),
        shipping_cost=ZERO_DECIMAL,
        payment_initiated_at=payment_initiated_at,
        paid_at=paid_at,
    )

    subtotal = ZERO_DECIMAL
    order_items = []
    for item in cart_snapshot:
        product = locked_products[item["product_id"]]
        quantity = int(item["quantity"])
        unit_price = Decimal(item["unit_price"])
        line_total = Decimal(item["line_total"])
        subtotal += line_total
        order_items.append(
            OrderItem(
                order=order,
                product=product,
                product_name=item["product_name"],
                quantity=quantity,
                price_at_purchase=unit_price,
                line_total=line_total,
            )
        )
        product.stock -= quantity
        product.save(update_fields=["stock", "updated_at"])

    OrderItem.objects.bulk_create(order_items)
    order.subtotal = subtotal
    order.total_price = subtotal + order.shipping_cost
    order.save(update_fields=["subtotal", "total_price", "updated_at"])
    return order


def _clear_cart_by_snapshot(cart, cart_snapshot):
    cart_items = {
        item.product_id: item
        for item in CartItem.objects.select_for_update().filter(
            cart=cart,
            product_id__in=[entry["product_id"] for entry in cart_snapshot],
        )
    }

    for entry in cart_snapshot:
        cart_item = cart_items.get(entry["product_id"])
        if cart_item is None:
            continue

        quantity = int(entry["quantity"])
        if cart_item.quantity <= quantity:
            cart_item.delete()
            continue

        cart_item.quantity -= quantity
        cart_item.save(update_fields=["quantity", "updated_at"])


def _update_session_from_gateway(session, gateway_result):
    session.provider = gateway_result.provider
    session.status = gateway_result.status
    session.provider_payment_id = gateway_result.payment_id or session.provider_payment_id
    session.last_error_code = gateway_result.last_error_code
    session.last_error_message = gateway_result.last_error_message
    session.payment_confirmed_at = gateway_result.confirmed_at or session.payment_confirmed_at
    session.save(
        update_fields=[
            "provider",
            "status",
            "provider_payment_id",
            "last_error_code",
            "last_error_message",
            "payment_confirmed_at",
            "updated_at",
        ]
    )


def _serialize_payment_session(session, *, client_secret="", publishable_key=""):
    return {
        "checkout_session_id": str(session.public_id),
        "provider": session.provider,
        "status": session.status,
        "amount": str(session.total_price),
        "currency": session.currency,
        "client_secret": client_secret or "",
        "publishable_key": publishable_key or "",
        "mock_mode": session.provider == CheckoutSession.Provider.MOCK,
        "message": session.last_error_message or "Secure card payment is ready.",
        "expires_at": session.expires_at,
    }


def _serialize_payment_confirmation(session, order=None):
    message = session.last_error_message or "Payment status updated."
    if order is not None:
        message = "Payment received and your order has been placed."
    elif session.status == CheckoutSession.Status.CANCELED:
        message = session.last_error_message or "Payment was canceled."
    elif session.status == CheckoutSession.Status.PROCESSING:
        message = "Payment is still processing. We will update the order when it clears."
    elif session.status == CheckoutSession.Status.REQUIRES_PAYMENT_METHOD:
        message = session.last_error_message or "Payment could not be completed. Please try another card."

    return {
        "checkout_session_id": str(session.public_id),
        "provider": session.provider,
        "status": session.status,
        "message": message,
        "order": order,
    }


@transaction.atomic
def create_order_from_cart(user, payload):
    cart, _ = Cart.objects.select_for_update().get_or_create(user=user)
    cart_items = list(CartItem.objects.select_related("product").filter(cart=cart))

    if not cart_items:
        raise serializers.ValidationError("Your cart is empty.")

    shipping_snapshot = _build_shipping_snapshot(user, payload)
    cart_snapshot = []
    for item in cart_items:
        product = item.product
        if item.quantity > product.stock:
            raise serializers.ValidationError(
                {
                    "stock": (
                        f"Only {product.stock} item(s) available for "
                        f"'{product.name}'."
                    )
                }
            )

        cart_snapshot.append(
            {
                "product_id": product.id,
                "product_name": product.name,
                "quantity": item.quantity,
                "unit_price": str(product.price),
                "line_total": str(product.price * item.quantity),
            }
        )

    order = _create_order_from_snapshot(
        user=user,
        shipping_snapshot=shipping_snapshot,
        cart_snapshot=cart_snapshot,
        payment_method=Order.PaymentMethod.COD,
        payment_status=Order.PaymentStatus.UNPAID,
    )
    CartItem.objects.filter(cart=cart).delete()
    return order


def create_card_payment_session(user, payload):
    checkout_snapshot = _build_cart_snapshot(user)
    shipping_snapshot = _build_shipping_snapshot(user, payload)
    gateway = get_payment_gateway()
    cart_signature = _serialize_signature(
        {
            "currency": settings.PAYMENT_CURRENCY,
            "items": checkout_snapshot.cart_snapshot,
            "total_price": str(checkout_snapshot.total_price),
        }
    )
    shipping_signature = _serialize_signature(shipping_snapshot)
    reusable_session = None
    sessions_to_cancel = []

    with transaction.atomic():
        active_sessions = list(
            CheckoutSession.objects.select_for_update()
            .filter(
                user=user,
                payment_method=Order.PaymentMethod.CARD,
                order__isnull=True,
                status__in=ACTIVE_PAYMENT_SESSION_STATUSES,
            )
            .order_by("-created_at")
        )

        for session in active_sessions:
            if session.expires_at and session.expires_at <= timezone.now():
                session.status = CheckoutSession.Status.CANCELED
                session.last_error_message = "Payment session expired. Please try again."
                session.save(update_fields=["status", "last_error_message", "updated_at"])
                sessions_to_cancel.append(session)
                continue

            same_checkout = (
                session.provider == gateway.provider
                and session.cart_signature == cart_signature
                and session.shipping_signature == shipping_signature
            )
            if reusable_session is None and same_checkout:
                reusable_session = session
                continue

            session.status = CheckoutSession.Status.CANCELED
            session.last_error_message = "A newer checkout attempt replaced this payment session."
            session.save(update_fields=["status", "last_error_message", "updated_at"])
            sessions_to_cancel.append(session)

        payment_session = reusable_session or CheckoutSession.objects.create(
            user=user,
            provider=gateway.provider,
            payment_method=Order.PaymentMethod.CARD,
            status=CheckoutSession.Status.INITIALIZED,
            currency=settings.PAYMENT_CURRENCY,
            cart_signature=cart_signature,
            shipping_signature=shipping_signature,
            shipping_snapshot=shipping_snapshot,
            cart_snapshot=checkout_snapshot.cart_snapshot,
            subtotal=checkout_snapshot.subtotal,
            shipping_cost=checkout_snapshot.shipping_cost,
            total_price=checkout_snapshot.total_price,
            expires_at=timezone.now()
            + timedelta(minutes=settings.CHECKOUT_SESSION_TTL_MINUTES),
        )

    for session in sessions_to_cancel:
        try:
            gateway.cancel_payment(session)
        except PaymentGatewayError:
            continue

    if reusable_session and reusable_session.provider_payment_id:
        client_secret = gateway.get_client_secret(reusable_session)
        return _serialize_payment_session(
            reusable_session,
            client_secret=client_secret,
            publishable_key=gateway.get_publishable_key(),
        )

    try:
        gateway_result = gateway.create_payment_session(payment_session, user)
    except PaymentGatewayError as exc:
        payment_session.last_error_message = exc.public_message
        payment_session.save(update_fields=["last_error_message", "updated_at"])
        raise serializers.ValidationError({"payment": exc.public_message}) from exc

    _update_session_from_gateway(payment_session, gateway_result)
    return _serialize_payment_session(
        payment_session,
        client_secret=gateway_result.client_secret,
        publishable_key=gateway.get_publishable_key(),
    )


@transaction.atomic
def finalize_checkout_session(payment_session):
    session = (
        CheckoutSession.objects.select_for_update()
        .select_related("order")
        .get(pk=payment_session.pk)
    )
    if session.order_id:
        return session.order

    cart = Cart.objects.select_for_update().filter(user=session.user).first()
    order = _create_order_from_snapshot(
        user=session.user,
        shipping_snapshot=session.shipping_snapshot,
        cart_snapshot=session.cart_snapshot,
        payment_method=Order.PaymentMethod.CARD,
        payment_status=Order.PaymentStatus.PAID,
        transaction_reference=session.provider_payment_id,
        payment_initiated_at=session.created_at,
        paid_at=session.payment_confirmed_at or timezone.now(),
    )

    if cart is not None:
        _clear_cart_by_snapshot(cart, session.cart_snapshot)

    session.order = order
    session.status = CheckoutSession.Status.COMPLETED
    session.last_error_code = ""
    session.last_error_message = ""
    session.save(
        update_fields=[
            "order",
            "status",
            "last_error_code",
            "last_error_message",
            "updated_at",
        ]
    )
    return order


def _handle_finalization_failure(payment_session, error):
    gateway = get_payment_gateway()
    message = (
        f"{error.public_message} If a charge was captured, it will be reversed automatically."
    )
    try:
        gateway.refund_payment(payment_session)
    except PaymentGatewayError:
        message = (
            f"{error.public_message} We could not finalize the order after payment confirmation."
        )

    payment_session.status = CheckoutSession.Status.CANCELED
    payment_session.last_error_message = message
    payment_session.save(update_fields=["status", "last_error_message", "updated_at"])
    return payment_session


def confirm_card_payment_session(user, checkout_session_id, simulate_result=""):
    try:
        payment_session = CheckoutSession.objects.select_related("order").get(
            public_id=checkout_session_id,
            user=user,
            payment_method=Order.PaymentMethod.CARD,
        )
    except CheckoutSession.DoesNotExist as exc:
        raise serializers.ValidationError(
            {"checkout_session_id": "Payment session not found."}
        ) from exc

    if payment_session.order_id:
        return _serialize_payment_confirmation(payment_session, payment_session.order)

    gateway = get_payment_gateway()
    try:
        gateway_result = gateway.sync_payment_session(
            payment_session,
            simulate_result=simulate_result,
        )
    except PaymentGatewayError as exc:
        raise serializers.ValidationError({"payment": exc.public_message}) from exc

    _update_session_from_gateway(payment_session, gateway_result)

    if payment_session.status == CheckoutSession.Status.SUCCEEDED:
        try:
            order = finalize_checkout_session(payment_session)
        except InventoryConflictError as exc:
            payment_session = _handle_finalization_failure(payment_session, exc)
            return _serialize_payment_confirmation(payment_session)
        payment_session.refresh_from_db()
        return _serialize_payment_confirmation(payment_session, order)

    return _serialize_payment_confirmation(payment_session)


def sync_card_payment_session_from_provider(
    *,
    provider_payment_id,
    status,
    last_error_code="",
    last_error_message="",
    confirmed_at=None,
):
    payment_session = (
        CheckoutSession.objects.select_related("order")
        .filter(provider_payment_id=provider_payment_id)
        .first()
    )
    if payment_session is None:
        return None

    payment_session.status = status
    payment_session.last_error_code = last_error_code
    payment_session.last_error_message = last_error_message
    payment_session.payment_confirmed_at = confirmed_at or payment_session.payment_confirmed_at
    payment_session.save(
        update_fields=[
            "status",
            "last_error_code",
            "last_error_message",
            "payment_confirmed_at",
            "updated_at",
        ]
    )

    if payment_session.order_id or status != CheckoutSession.Status.SUCCEEDED:
        return payment_session

    try:
        finalize_checkout_session(payment_session)
    except InventoryConflictError as exc:
        _handle_finalization_failure(payment_session, exc)
    return payment_session
