from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Order
from .serializers import CheckoutSerializer, OrderDetailSerializer, OrderListSerializer
from .services import create_order_from_cart


class CheckoutAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = CheckoutSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        order = create_order_from_cart(request.user, serializer.validated_data)
        data = OrderDetailSerializer(order, context={"request": request}).data
        return Response(data, status=status.HTTP_201_CREATED)


class OrderListAPIView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = OrderListSerializer

    def get_queryset(self):
        queryset = Order.objects.prefetch_related("items").order_by("-created_at")
        if self.request.user.is_staff:
            return queryset
        return queryset.filter(user=self.request.user)


class OrderDetailAPIView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = OrderDetailSerializer

    def get_queryset(self):
        queryset = Order.objects.prefetch_related("items").order_by("-created_at")
        if self.request.user.is_staff:
            return queryset
        return queryset.filter(user=self.request.user)
