from django.urls import path

from .views import (
    AddressListCreateView,
    ForgotPasswordView,
    LoginView,
    MeView,
    ProfileView,
    RefreshView,
    RegisterView,
    ResetPasswordView,
    TestEmailView,
)


urlpatterns = [
    path("auth/register", RegisterView.as_view(), name="auth-register"),
    path("auth/login", LoginView.as_view(), name="auth-login"),
    path("auth/refresh", RefreshView.as_view(), name="auth-refresh"),
    path("auth/password/forgot", ForgotPasswordView.as_view(), name="auth-password-forgot"),
    path("auth/password/reset", ResetPasswordView.as_view(), name="auth-password-reset"),
    path("test-email", TestEmailView.as_view(), name="test-email"),
    path("auth/me", MeView.as_view(), name="auth-me"),
    path("profile", ProfileView.as_view(), name="profile"),
    path("addresses", AddressListCreateView.as_view(), name="address-list-create"),
]
