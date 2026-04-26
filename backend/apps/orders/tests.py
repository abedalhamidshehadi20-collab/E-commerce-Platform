from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.cart.models import Cart, CartItem
from apps.products.models import Category, Product
from apps.users.models import Address
from .models import CheckoutSession, Order

User = get_user_model()


class CheckoutPaymentFlowTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="buyer@example.com",
            username="buyer",
            password="strong-password-123",
        )
        self.category = Category.objects.create(name="Audio")
        self.product = Product.objects.create(
            category=self.category,
            name="Studio Headphones",
            sku="AUDIO-001",
            description="Closed-back studio headphones.",
            price="60.00",
            stock=8,
        )
        self.address = Address.objects.create(
            user=self.user,
            label="Home",
            full_name="Jordan Lee",
            phone_number="+1 555 123 4567",
            line1="123 Market Street",
            line2="",
            city="Boston",
            state="MA",
            postal_code="02118",
            country="United States",
            is_default=True,
        )
        self.client.force_authenticate(self.user)

    def _seed_cart(self, quantity=2):
        cart, _ = Cart.objects.get_or_create(user=self.user)
        CartItem.objects.create(cart=cart, product=self.product, quantity=quantity)
        return cart

    def test_cod_checkout_creates_unpaid_order_and_clears_cart(self):
        self._seed_cart()

        response = self.client.post(
            reverse("order-checkout"),
            {
                "payment_method": "cod",
                "address_id": self.address.id,
                "notes": "Ring the bell",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Order.objects.count(), 1)
        order = Order.objects.get()
        self.assertEqual(order.payment_method, Order.PaymentMethod.COD)
        self.assertEqual(order.payment_status, Order.PaymentStatus.UNPAID)
        self.assertEqual(order.total_price, order.subtotal)
        self.assertEqual(order.notes, "Ring the bell")
        self.assertFalse(CartItem.objects.filter(cart__user=self.user).exists())
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 6)

    def test_cod_checkout_rejects_empty_cart(self):
        response = self.client.post(
            reverse("order-checkout"),
            {
                "payment_method": "cod",
                "address_id": self.address.id,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Order.objects.count(), 0)
        self.assertIn("Your cart is empty.", response.data["message"])

    def test_card_payment_confirmation_creates_paid_order(self):
        self._seed_cart()

        session_response = self.client.post(
            reverse("order-payment-session-create"),
            {
                "payment_method": "card",
                "address_id": self.address.id,
            },
            format="json",
        )
        self.assertEqual(session_response.status_code, status.HTTP_200_OK)
        self.assertEqual(CheckoutSession.objects.count(), 1)

        confirm_response = self.client.post(
            reverse("order-payment-session-confirm"),
            {
                "checkout_session_id": session_response.data["checkout_session_id"],
                "simulate_result": "succeeded",
            },
            format="json",
        )

        self.assertEqual(confirm_response.status_code, status.HTTP_200_OK)
        self.assertEqual(confirm_response.data["status"], CheckoutSession.Status.COMPLETED)
        self.assertEqual(Order.objects.count(), 1)
        order = Order.objects.get()
        self.assertEqual(order.payment_method, Order.PaymentMethod.CARD)
        self.assertEqual(order.payment_status, Order.PaymentStatus.PAID)
        self.assertTrue(order.transaction_reference.startswith("mock_pi_"))
        self.assertIsNotNone(order.paid_at)
        self.assertFalse(CartItem.objects.filter(cart__user=self.user).exists())
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 6)

    def test_card_payment_failure_keeps_cart_intact(self):
        self._seed_cart()

        session_response = self.client.post(
            reverse("order-payment-session-create"),
            {
                "payment_method": "card",
                "address_id": self.address.id,
            },
            format="json",
        )
        self.assertEqual(session_response.status_code, status.HTTP_200_OK)

        confirm_response = self.client.post(
            reverse("order-payment-session-confirm"),
            {
                "checkout_session_id": session_response.data["checkout_session_id"],
                "simulate_result": "failed",
            },
            format="json",
        )

        self.assertEqual(confirm_response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            confirm_response.data["status"],
            CheckoutSession.Status.REQUIRES_PAYMENT_METHOD,
        )
        self.assertEqual(Order.objects.count(), 0)
        self.assertTrue(CartItem.objects.filter(cart__user=self.user).exists())
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 8)

    def test_confirming_the_same_paid_session_twice_is_idempotent(self):
        self._seed_cart()

        session_response = self.client.post(
            reverse("order-payment-session-create"),
            {
                "payment_method": "card",
                "address_id": self.address.id,
            },
            format="json",
        )

        payload = {
            "checkout_session_id": session_response.data["checkout_session_id"],
            "simulate_result": "succeeded",
        }
        first_response = self.client.post(
            reverse("order-payment-session-confirm"),
            payload,
            format="json",
        )
        second_response = self.client.post(
            reverse("order-payment-session-confirm"),
            payload,
            format="json",
        )

        self.assertEqual(first_response.status_code, status.HTTP_200_OK)
        self.assertEqual(second_response.status_code, status.HTTP_200_OK)
        self.assertEqual(Order.objects.count(), 1)
        self.assertEqual(first_response.data["order"]["id"], second_response.data["order"]["id"])
