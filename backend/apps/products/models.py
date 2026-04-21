import uuid

from django.db import models
from django.db.models import Q
from django.utils.text import slugify


def build_unique_slug(instance, value):
    base_slug = slugify(value)[:180] or uuid.uuid4().hex[:10]
    slug = base_slug
    counter = 2

    while instance.__class__.objects.exclude(pk=instance.pk).filter(slug=slug).exists():
        slug = f"{base_slug[:170]}-{counter}"
        counter += 1

    return slug


class Category(models.Model):
    name = models.CharField(max_length=150, unique=True)
    slug = models.SlugField(max_length=200, unique=True, blank=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to="categories/", blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "categories"
        ordering = ("name",)
        indexes = [
            models.Index(fields=["name"], name="idx_categories_name"),
            models.Index(fields=["is_active"], name="idx_categories_active"),
        ]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = build_unique_slug(self, self.name)
        super().save(*args, **kwargs)


class Product(models.Model):
    category = models.ForeignKey(
        Category, on_delete=models.PROTECT, related_name="products"
    )
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    sku = models.CharField(max_length=64, unique=True)
    short_description = models.CharField(max_length=255, blank=True)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "products"
        ordering = ("-created_at",)
        constraints = [
            models.CheckConstraint(check=Q(price__gte=0), name="products_price_non_negative"),
            models.CheckConstraint(check=Q(stock__gte=0), name="products_stock_non_negative"),
        ]
        indexes = [
            models.Index(fields=["category"], name="idx_products_category"),
            models.Index(fields=["price"], name="idx_products_price"),
            models.Index(fields=["created_at"], name="idx_products_created"),
            models.Index(fields=["is_active"], name="idx_products_active"),
            models.Index(fields=["is_featured"], name="idx_products_featured"),
            models.Index(fields=["name"], name="idx_products_name"),
        ]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = build_unique_slug(self, self.name)
        super().save(*args, **kwargs)


class ProductImage(models.Model):
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="images"
    )
    image = models.ImageField(upload_to="products/")
    alt_text = models.CharField(max_length=255, blank=True)
    is_primary = models.BooleanField(default=False)
    sort_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "product_images"
        ordering = ("sort_order", "id")
        constraints = [
            models.UniqueConstraint(
                fields=["product"],
                condition=Q(is_primary=True),
                name="one_primary_image_per_product",
            )
        ]
        indexes = [
            models.Index(fields=["product"], name="idx_product_images_product"),
            models.Index(fields=["sort_order"], name="idx_product_images_sort"),
        ]

    def __str__(self):
        return f"{self.product.name} image"
