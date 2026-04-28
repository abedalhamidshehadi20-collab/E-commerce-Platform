from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Coupon
from .serializers import ApplyCouponSerializer, CouponSerializer
from .services import validate_coupon_for_user


class CouponListAPIView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CouponSerializer
    pagination_class = None

    def get_queryset(self):
        return Coupon.objects.filter(user=self.request.user).order_by("used", "expires_at")


class CouponApplyAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ApplyCouponSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = validate_coupon_for_user(
            request.user,
            serializer.validated_data["code"],
            serializer.validated_data["cart_total"],
        )
        return Response(
            {
                "code": result.coupon.code,
                "discount": result.discount,
                "final_price": result.final_price,
            },
            status=status.HTTP_200_OK,
        )
