from django.urls import path

from .views import AddressListCreateView, LoginView, MeView, ProfileView, RefreshView, RegisterView


urlpatterns = [
    path("auth/register", RegisterView.as_view(), name="auth-register"),
    path("auth/login", LoginView.as_view(), name="auth-login"),
    path("auth/refresh", RefreshView.as_view(), name="auth-refresh"),
    path("auth/me", MeView.as_view(), name="auth-me"),
    path("profile", ProfileView.as_view(), name="profile"),
    path("addresses", AddressListCreateView.as_view(), name="address-list-create"),
]
