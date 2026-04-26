from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.products.models import Category, Product
from .models import WishlistItem

User = get_user_model()


class WishlistAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="shopper@example.com",
            username="shopper",
            password="strong-password-123",
        )
        self.category = Category.objects.create(name="Electronics")
        self.product = Product.objects.create(
            category=self.category,
            name="Wireless Headphones",
            sku="WH-001",
            description="Noise-canceling over-ear headphones.",
            price="199.99",
            stock=12,
        )
        self.client.force_authenticate(self.user)

    def test_user_gets_wishlist_created_automatically(self):
        self.assertTrue(hasattr(self.user, "wishlist"))
        self.assertEqual(self.user.wishlist.total_items, 0)

    def test_adding_same_product_twice_keeps_one_wishlist_item(self):
        add_url = reverse("wishlist-add")

        first_response = self.client.post(add_url, {"product_id": self.product.id}, format="json")
        second_response = self.client.post(add_url, {"product_id": self.product.id}, format="json")

        self.assertEqual(first_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(second_response.status_code, status.HTTP_200_OK)
        self.assertEqual(WishlistItem.objects.filter(product=self.product).count(), 1)
        self.assertEqual(second_response.data["wishlist"]["total_items"], 1)
        self.assertEqual(second_response.data["wishlist"]["items"][0]["product"]["name"], self.product.name)

    def test_remove_and_clear_endpoints_update_wishlist(self):
        WishlistItem.objects.create(wishlist=self.user.wishlist, product=self.product)
        second_product = Product.objects.create(
            category=self.category,
            name="Bluetooth Speaker",
            sku="BS-002",
            description="Portable speaker with deep bass.",
            price="89.99",
            stock=5,
        )
        WishlistItem.objects.create(wishlist=self.user.wishlist, product=second_product)

        remove_response = self.client.delete(
            reverse("wishlist-remove", kwargs={"product_id": self.product.id})
        )
        clear_response = self.client.delete(reverse("wishlist-clear"))

        self.assertEqual(remove_response.status_code, status.HTTP_200_OK)
        self.assertEqual(remove_response.data["wishlist"]["total_items"], 1)
        self.assertEqual(clear_response.status_code, status.HTTP_200_OK)
        self.assertEqual(clear_response.data["wishlist"]["total_items"], 0)
