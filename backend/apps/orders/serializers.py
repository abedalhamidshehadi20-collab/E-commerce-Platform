from rest_framework import serializers

from apps.cart.models import Cart
from apps.users.models import Address

from .models import CheckoutSession, Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = [
            "id",
            "product",
            "product_name",
            "quantity",
            "price_at_purchase",
            "line_total",
        ]


class OrderListSerializer(serializers.ModelSerializer):
    items_count = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "id",
            "order_number",
            "status",
            "payment_method",
            "payment_status",
            "total_price",
            "items_count",
            "paid_at",
            "created_at",
        ]

    def get_items_count(self, obj):
        return obj.items.count()


class OrderDetailSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "order_number",
            "status",
            "payment_method",
            "payment_status",
            "transaction_reference",
            "shipping_full_name",
            "shipping_phone_number",
            "shipping_line1",
            "shipping_line2",
            "shipping_city",
            "shipping_state",
            "shipping_postal_code",
            "shipping_country",
            "notes",
            "subtotal",
            "shipping_cost",
            "total_price",
            "payment_initiated_at",
            "paid_at",
            "created_at",
            "items",
        ]


class BaseCheckoutSerializer(serializers.Serializer):
    payment_method = serializers.ChoiceField(
        choices=Order.PaymentMethod.choices,
        required=False,
        default=Order.PaymentMethod.COD,
    )
    address_id = serializers.IntegerField(required=False)
    full_name = serializers.CharField(required=False, allow_blank=False)
    phone_number = serializers.CharField(required=False, allow_blank=False)
    line1 = serializers.CharField(required=False, allow_blank=False)
    line2 = serializers.CharField(required=False, allow_blank=True, default="")
    city = serializers.CharField(required=False, allow_blank=False)
    state = serializers.CharField(required=False, allow_blank=False)
    postal_code = serializers.CharField(required=False, allow_blank=False)
    country = serializers.CharField(required=False, allow_blank=False)
    save_address = serializers.BooleanField(required=False, default=False)
    label = serializers.CharField(required=False, allow_blank=True, default="")
    notes = serializers.CharField(required=False, allow_blank=True, default="")

    def validate(self, attrs):
        user = self.context["request"].user
        if not Cart.objects.filter(user=user, items__isnull=False).exists():
            raise serializers.ValidationError("Your cart is empty.")

        address_id = attrs.get("address_id")
        if address_id:
            try:
                address = Address.objects.get(pk=address_id, user=user)
            except Address.DoesNotExist as exc:
                raise serializers.ValidationError(
                    {"address_id": "Address not found."}
                ) from exc
            attrs["address"] = address
            return attrs

        required_fields = [
            "full_name",
            "phone_number",
            "line1",
            "city",
            "state",
            "postal_code",
            "country",
        ]
        missing = {
            field: "This field is required."
            for field in required_fields
            if not attrs.get(field)
        }
        if missing:
            raise serializers.ValidationError(missing)

        return attrs


class CheckoutSerializer(BaseCheckoutSerializer):
    def validate_payment_method(self, value):
        if value != Order.PaymentMethod.COD:
            raise serializers.ValidationError(
                "Use the payment session endpoint for card payments."
            )
        return value


class PaymentSessionCreateSerializer(BaseCheckoutSerializer):
    payment_method = serializers.ChoiceField(
        choices=Order.PaymentMethod.choices,
        required=False,
        default=Order.PaymentMethod.CARD,
    )

    def validate_payment_method(self, value):
        if value != Order.PaymentMethod.CARD:
            raise serializers.ValidationError("Card payment is required for this step.")
        return value


class PaymentSessionConfirmSerializer(serializers.Serializer):
    checkout_session_id = serializers.UUIDField()
    simulate_result = serializers.ChoiceField(
        choices=[
            ("", "None"),
            ("succeeded", "Succeeded"),
            ("failed", "Failed"),
            ("canceled", "Canceled"),
            ("timeout", "Timeout"),
        ],
        required=False,
        allow_blank=True,
        default="",
    )


class PaymentSessionSerializer(serializers.ModelSerializer):
    checkout_session_id = serializers.UUIDField(source="public_id", read_only=True)
    amount = serializers.DecimalField(source="total_price", max_digits=10, decimal_places=2)
    mock_mode = serializers.SerializerMethodField()

    class Meta:
        model = CheckoutSession
        fields = [
            "checkout_session_id",
            "provider",
            "status",
            "amount",
            "currency",
            "mock_mode",
            "expires_at",
        ]

    def get_mock_mode(self, obj):
        return obj.provider == CheckoutSession.Provider.MOCK
