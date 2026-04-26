from django.db.models import Prefetch
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.products.models import Product, ProductImage

from .models import Wishlist, WishlistItem
from .serializers import WishlistItemActionSerializer, WishlistSerializer


def get_user_wishlist(user):
    wishlist, _ = Wishlist.objects.get_or_create(user=user)
    return wishlist


def wishlist_queryset():
    images = ProductImage.objects.order_by("sort_order", "id")
    items = WishlistItem.objects.select_related("product").prefetch_related(
        Prefetch("product__images", queryset=images)
    )
    return Wishlist.objects.prefetch_related(
        Prefetch("items", queryset=items)
    ).select_related("user")


def serialized_wishlist_response(request, wishlist, message=None, http_status=status.HTTP_200_OK):
    payload = {
        "wishlist": WishlistSerializer(wishlist, context={"request": request}).data,
    }
    if message:
        payload["message"] = message
    return Response(payload, status=http_status)


class WishlistView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        wishlist = get_user_wishlist(request.user)
        wishlist = wishlist_queryset().get(pk=wishlist.pk)
        serializer = WishlistSerializer(wishlist, context={"request": request})
        return Response(serializer.data)


class WishlistAddView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = WishlistItemActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product = Product.objects.get(pk=serializer.validated_data["product_id"], is_active=True)
        wishlist = get_user_wishlist(request.user)

        item, created = WishlistItem.objects.get_or_create(wishlist=wishlist, product=product)
        wishlist = wishlist_queryset().get(pk=wishlist.pk)

        if created:
            return serialized_wishlist_response(
                request,
                wishlist,
                message="Product added to wishlist.",
                http_status=status.HTTP_201_CREATED,
            )

        return serialized_wishlist_response(
            request,
            wishlist,
            message="Product is already in your wishlist.",
        )


class WishlistRemoveView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, product_id):
        wishlist = get_user_wishlist(request.user)
        deleted, _ = WishlistItem.objects.filter(wishlist=wishlist, product_id=product_id).delete()

        if not deleted:
            return Response(
                {
                    "message": "Wishlist item not found.",
                    "errors": {"product_id": ["This product is not in the wishlist."]},
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        wishlist = wishlist_queryset().get(pk=wishlist.pk)
        return serialized_wishlist_response(
            request, wishlist, message="Product removed from wishlist."
        )


class WishlistClearView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        wishlist = get_user_wishlist(request.user)
        wishlist.items.all().delete()
        wishlist = wishlist_queryset().get(pk=wishlist.pk)
        return serialized_wishlist_response(request, wishlist, message="Wishlist cleared.")
