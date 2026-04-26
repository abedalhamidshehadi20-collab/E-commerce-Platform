from django.contrib import admin

from .models import Wishlist, WishlistItem


class WishlistItemInline(admin.TabularInline):
    model = WishlistItem
    extra = 0
    autocomplete_fields = ["product"]
    readonly_fields = ["added_at"]


@admin.register(Wishlist)
class WishlistAdmin(admin.ModelAdmin):
    list_display = ["id", "user", "created_at", "total_items"]
    search_fields = ["user__email", "user__username"]
    readonly_fields = ["created_at"]
    inlines = [WishlistItemInline]


@admin.register(WishlistItem)
class WishlistItemAdmin(admin.ModelAdmin):
    list_display = ["id", "wishlist", "product", "added_at"]
    list_select_related = ["wishlist", "product", "wishlist__user"]
    search_fields = ["wishlist__user__email", "product__name", "product__sku"]
    readonly_fields = ["added_at"]
    autocomplete_fields = ["wishlist", "product"]
