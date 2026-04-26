from django.conf import settings
from django.http import HttpResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .gateways import stripe
from .models import CheckoutSession, Order
from .serializers import (
    CheckoutSerializer,
    OrderDetailSerializer,
    OrderListSerializer,
    PaymentSessionConfirmSerializer,
    PaymentSessionCreateSerializer,
)
from .services import (
    confirm_card_payment_session,
    create_card_payment_session,
    create_order_from_cart,
    sync_card_payment_session_from_provider,
)


class CheckoutAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = CheckoutSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        order = create_order_from_cart(request.user, serializer.validated_data)
        data = OrderDetailSerializer(order, context={"request": request}).data
        return Response(data, status=status.HTTP_201_CREATED)


class PaymentSessionCreateAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PaymentSessionCreateSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        data = create_card_payment_session(request.user, serializer.validated_data)
        return Response(data, status=status.HTTP_200_OK)


class PaymentSessionConfirmAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PaymentSessionConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = confirm_card_payment_session(request.user, **serializer.validated_data)
        order = data.get("order")
        if order is not None:
            data["order"] = OrderDetailSerializer(order, context={"request": request}).data
        return Response(data, status=status.HTTP_200_OK)


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


@csrf_exempt
def stripe_webhook_view(request):
    if request.method != "POST":
        return HttpResponse(status=status.HTTP_405_METHOD_NOT_ALLOWED)

    if settings.PAYMENT_PROVIDER.lower() != CheckoutSession.Provider.STRIPE:
        return HttpResponse(status=status.HTTP_204_NO_CONTENT)

    if stripe is None or not settings.STRIPE_WEBHOOK_SECRET:
        return HttpResponse(status=status.HTTP_400_BAD_REQUEST)

    payload = request.body
    signature = request.META.get("HTTP_STRIPE_SIGNATURE", "")

    try:
        event = stripe.Webhook.construct_event(
            payload,
            signature,
            settings.STRIPE_WEBHOOK_SECRET,
        )
    except (ValueError, stripe.error.SignatureVerificationError):
        return HttpResponse(status=status.HTTP_400_BAD_REQUEST)

    event_type = event["type"]
    payment_intent = event["data"]["object"]
    payment_id = payment_intent["id"]

    if event_type == "payment_intent.succeeded":
        sync_card_payment_session_from_provider(
            provider_payment_id=payment_id,
            status=CheckoutSession.Status.SUCCEEDED,
            confirmed_at=timezone.now(),
        )
    elif event_type == "payment_intent.processing":
        sync_card_payment_session_from_provider(
            provider_payment_id=payment_id,
            status=CheckoutSession.Status.PROCESSING,
        )
    elif event_type == "payment_intent.payment_failed":
        payment_error = payment_intent.get("last_payment_error") or {}
        sync_card_payment_session_from_provider(
            provider_payment_id=payment_id,
            status=CheckoutSession.Status.REQUIRES_PAYMENT_METHOD,
            last_error_code=payment_error.get("code", "payment_failed"),
            last_error_message=payment_error.get(
                "message",
                "Payment could not be completed. Please try another card.",
            ),
        )
    elif event_type == "payment_intent.canceled":
        sync_card_payment_session_from_provider(
            provider_payment_id=payment_id,
            status=CheckoutSession.Status.CANCELED,
            last_error_code="payment_canceled",
            last_error_message="Payment was canceled before completion.",
        )

    return HttpResponse(status=status.HTTP_200_OK)
