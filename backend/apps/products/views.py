from django.db.models import Count, Prefetch
from rest_framework import generics, permissions

from .filters import ProductFilter
from .models import Category, Product, ProductImage
from .serializers import CategorySerializer, ProductDetailSerializer, ProductListSerializer


class CategoryListAPIView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = CategorySerializer
    pagination_class = None

    def get_queryset(self):
        return (
            Category.objects.filter(is_active=True)
            .annotate(product_count=Count("products"))
            .order_by("name")
        )


class ProductListAPIView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = ProductListSerializer
    filterset_class = ProductFilter
    search_fields = ["name", "description", "category__name", "sku"]
    ordering_fields = ["price", "created_at"]
    ordering = ["-created_at"]

    def get_queryset(self):
        images = ProductImage.objects.order_by("sort_order", "id")
        return (
            Product.objects.filter(is_active=True)
            .select_related("category")
            .prefetch_related(Prefetch("images", queryset=images))
        )


class ProductDetailAPIView(generics.RetrieveAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = ProductDetailSerializer

    def get_queryset(self):
        images = ProductImage.objects.order_by("sort_order", "id")
        return (
            Product.objects.filter(is_active=True)
            .select_related("category")
            .prefetch_related(Prefetch("images", queryset=images))
        )
