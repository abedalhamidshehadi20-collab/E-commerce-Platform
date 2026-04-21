from django.db.models import Prefetch
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.products.models import Product, ProductImage

from .models import Cart, CartItem
from .serializers import (
    CartItemActionSerializer,
    CartRemoveSerializer,
    CartSerializer,
)


def get_user_cart(user):
    cart, _ = Cart.objects.get_or_create(user=user)
    return cart


def cart_queryset():
    images = ProductImage.objects.order_by("sort_order", "id")
    return Cart.objects.prefetch_related(
        Prefetch("items__product__images", queryset=images)
    ).select_related("user")


class CartView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        cart = get_user_cart(request.user)
        cart = cart_queryset().get(pk=cart.pk)
        serializer = CartSerializer(cart, context={"request": request})
        return Response(serializer.data)


class CartAddView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = CartItemActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product = Product.objects.get(pk=serializer.validated_data["product_id"], is_active=True)
        quantity = serializer.validated_data["quantity"]
        cart = get_user_cart(request.user)

        item, created = CartItem.objects.get_or_create(cart=cart, product=product)
        desired_quantity = quantity if created else item.quantity + quantity

        if desired_quantity > product.stock:
            return Response(
                {
                    "message": "Not enough stock available for this product.",
                    "errors": {"quantity": ["Requested quantity exceeds stock."]},
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        item.quantity = desired_quantity
        item.save()

        cart = cart_queryset().get(pk=cart.pk)
        return Response(CartSerializer(cart, context={"request": request}).data, status=201)


class CartUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request):
        serializer = CartItemActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product = Product.objects.get(pk=serializer.validated_data["product_id"], is_active=True)
        quantity = serializer.validated_data["quantity"]
        cart = get_user_cart(request.user)

        if quantity > product.stock:
            return Response(
                {
                    "message": "Not enough stock available for this product.",
                    "errors": {"quantity": ["Requested quantity exceeds stock."]},
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            item = CartItem.objects.get(cart=cart, product=product)
        except CartItem.DoesNotExist:
            return Response(
                {
                    "message": "Cart item not found.",
                    "errors": {"product_id": ["This product is not in the cart."]},
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        item.quantity = quantity
        item.save(update_fields=["quantity", "updated_at"])
        cart = cart_queryset().get(pk=cart.pk)
        return Response(CartSerializer(cart, context={"request": request}).data)


class CartRemoveView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        serializer = CartRemoveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cart = get_user_cart(request.user)

        deleted, _ = CartItem.objects.filter(
            cart=cart, product_id=serializer.validated_data["product_id"]
        ).delete()
        if not deleted:
            return Response(
                {
                    "message": "Cart item not found.",
                    "errors": {"product_id": ["This product is not in the cart."]},
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        cart = cart_queryset().get(pk=cart.pk)
        return Response(CartSerializer(cart, context={"request": request}).data)
