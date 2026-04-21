from rest_framework import serializers

from .models import Cart, CartItem
from apps.products.models import Product


class CartProductSerializer(serializers.ModelSerializer):
    primary_image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ["id", "name", "price", "stock", "primary_image"]

    def get_primary_image(self, obj):
        request = self.context.get("request")
        image = next((item for item in obj.images.all() if item.is_primary), None)
        if image is None:
            image = next(iter(obj.images.all()), None)
        if image is None:
            return ""
        url = image.image.url
        return request.build_absolute_uri(url) if request else url


class CartItemSerializer(serializers.ModelSerializer):
    product = CartProductSerializer(read_only=True)
    line_total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = CartItem
        fields = ["id", "product", "quantity", "line_total", "created_at"]


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_items = serializers.IntegerField(read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Cart
        fields = ["id", "items", "total_items", "subtotal", "updated_at"]


class CartItemActionSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1, required=False, default=1)

    def validate_product_id(self, value):
        if not Product.objects.filter(pk=value, is_active=True).exists():
            raise serializers.ValidationError("Product not found.")
        return value


class CartRemoveSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()

    def validate_product_id(self, value):
        if not Product.objects.filter(pk=value).exists():
            raise serializers.ValidationError("Product not found.")
        return value
