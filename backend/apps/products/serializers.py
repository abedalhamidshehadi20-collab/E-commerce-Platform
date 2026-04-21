from django.db.models import Count
from rest_framework import serializers

from .models import Category, Product, ProductImage


class CategorySerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    product_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Category
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "image_url",
            "product_count",
        ]

    def get_image_url(self, obj):
        if not obj.image:
            return ""
        request = self.context.get("request")
        url = obj.image.url
        return request.build_absolute_uri(url) if request else url


class ProductImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ["id", "image_url", "alt_text", "is_primary", "sort_order"]

    def get_image_url(self, obj):
        request = self.context.get("request")
        url = obj.image.url
        return request.build_absolute_uri(url) if request else url


class ProductListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    primary_image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "slug",
            "sku",
            "short_description",
            "price",
            "stock",
            "is_featured",
            "category",
            "category_name",
            "primary_image",
            "created_at",
        ]

    def get_primary_image(self, obj):
        request = self.context.get("request")
        image = next((item for item in obj.images.all() if item.is_primary), None)
        if image is None:
            image = next(iter(obj.images.all()), None)
        if image is None:
            return ""
        url = image.image.url
        return request.build_absolute_uri(url) if request else url


class ProductDetailSerializer(ProductListSerializer):
    description = serializers.CharField()
    images = ProductImageSerializer(many=True, read_only=True)
    category = CategorySerializer(read_only=True)
    stock_status = serializers.SerializerMethodField()

    class Meta(ProductListSerializer.Meta):
        fields = ProductListSerializer.Meta.fields + [
            "description",
            "images",
            "stock_status",
            "is_active",
            "updated_at",
        ]

    def get_stock_status(self, obj):
        if obj.stock <= 0:
            return "Out of stock"
        if obj.stock <= 5:
            return "Low stock"
        return "In stock"
