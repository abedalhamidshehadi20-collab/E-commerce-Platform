from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Address, User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = (
        "email",
        "username",
        "first_name",
        "last_name",
        "role",
        "is_staff",
        "date_joined",
    )
    search_fields = ("email", "username", "first_name", "last_name")
    ordering = ("-date_joined",)
    fieldsets = (
        (None, {"fields": ("email", "username", "password")}),
        (
            "Personal info",
            {"fields": ("first_name", "last_name", "phone_number", "avatar")},
        ),
        (
            "Permissions",
            {
                "fields": (
                    "role",
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "email",
                    "username",
                    "password1",
                    "password2",
                    "role",
                    "is_staff",
                    "is_active",
                ),
            },
        ),
    )


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ("full_name", "user", "city", "country", "is_default", "created_at")
    list_filter = ("country", "city", "is_default")
    search_fields = ("full_name", "user__email", "line1", "city", "postal_code")
