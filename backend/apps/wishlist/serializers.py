from rest_framework import serializers

from apps.products.models import Product

from .models import Wishlist, WishlistItem


class WishlistProductSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ["id", "name", "price", "image", "description", "stock"]

    def get_image(self, obj):
        request = self.context.get("request")
        image = next((item for item in obj.images.all() if item.is_primary), None)
        if image is None:
            image = next(iter(obj.images.all()), None)
        if image is None:
            return ""
        url = image.image.url
        return request.build_absolute_uri(url) if request else url


class WishlistItemSerializer(serializers.ModelSerializer):
    product = WishlistProductSerializer(read_only=True)

    class Meta:
        model = WishlistItem
        fields = ["id", "product", "added_at"]


class WishlistSerializer(serializers.ModelSerializer):
    items = WishlistItemSerializer(many=True, read_only=True)
    total_items = serializers.IntegerField(read_only=True)

    class Meta:
        model = Wishlist
        fields = ["id", "items", "total_items", "created_at"]


class WishlistItemActionSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()

    def validate_product_id(self, value):
        if not Product.objects.filter(pk=value, is_active=True).exists():
            raise serializers.ValidationError("Product not found.")
        return value
