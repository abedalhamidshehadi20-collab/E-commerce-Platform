import logging
import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password, make_password
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils import timezone
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .models import Address, PasswordResetCode
from .serializers import (
    AddressSerializer,
    AuthResponseSerializer,
    CustomTokenObtainPairSerializer,
    ForgotPasswordSerializer,
    ProfileSerializer,
    RegisterSerializer,
    ResetPasswordSerializer,
    UserSerializer,
)


User = get_user_model()
logger = logging.getLogger(__name__)


def build_reset_email_payload(user, code):
    frontend_base_url = settings.FRONTEND_URL.rstrip("/")
    reset_url = f"{frontend_base_url}/reset-password?email={user.email}"
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    token_url = f"{frontend_base_url}/reset-password?uid={uid}&token={token}"

    subject = "Reset your A-SH Store password"
    message = (
        "We received a request to reset your password.\n\n"
        f"Your verification code is: {code}\n"
        f"This code expires in {settings.PASSWORD_RESET_CODE_TTL_MINUTES} minutes.\n\n"
        f"Reset using the code here: {reset_url}\n"
        f"Or use this secure link: {token_url}\n\n"
        "If you did not request this, you can safely ignore this email."
    )
    return subject, message


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            AuthResponseSerializer.for_user(user, context={"request": request}),
            status=status.HTTP_201_CREATED,
        )


class LoginView(TokenObtainPairView):
    permission_classes = [permissions.AllowAny]
    serializer_class = CustomTokenObtainPairSerializer


class RefreshView(TokenRefreshView):
    permission_classes = [permissions.AllowAny]


class ForgotPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"].lower()
        user = User.objects.filter(email__iexact=email, is_active=True).first()

        if user:
            now = timezone.now()
            max_per_hour = settings.PASSWORD_RESET_CODE_MAX_PER_HOUR
            if max_per_hour > 0:
                recent_count = PasswordResetCode.objects.filter(
                    user=user, created_at__gte=now - timedelta(hours=1)
                ).count()
                if recent_count >= max_per_hour:
                    return Response(
                        {"error": "Too many reset requests. Please try again later."},
                        status=status.HTTP_429_TOO_MANY_REQUESTS,
                    )

            latest_code = PasswordResetCode.objects.filter(user=user).first()
            if latest_code and (now - latest_code.created_at).total_seconds() < settings.PASSWORD_RESET_CODE_RESEND_SECONDS:
                return Response(
                    {"error": "Please wait a moment before requesting another reset code."},
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                )

            PasswordResetCode.objects.filter(user=user, used_at__isnull=True).update(
                used_at=now
            )

            code = f"{secrets.randbelow(1000000):06d}"
            expires_at = now + timedelta(minutes=settings.PASSWORD_RESET_CODE_TTL_MINUTES)
            PasswordResetCode.objects.create(
                user=user,
                code_hash=make_password(code),
                expires_at=expires_at,
            )

            subject, message = build_reset_email_payload(user, code)
            try:
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=False,
                )
            except Exception:
                logger.exception(
                    "Failed to send password reset email",
                    extra={"user_id": user.id, "email": user.email},
                )
                return Response(
                    {"error": "Failed to send verification email."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        return Response(
            {
                "message": "If an account with that email exists, a password reset code has been sent."
            },
            status=status.HTTP_200_OK,
        )


class ResetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        uid = serializer.validated_data.get("uid")
        token = serializer.validated_data.get("token")
        email = serializer.validated_data.get("email")
        code = serializer.validated_data.get("code")
        new_password = serializer.validated_data["new_password"]

        if email and code:
            normalized_email = email.lower()
            user = User.objects.filter(email__iexact=normalized_email, is_active=True).first()
            if not user:
                return Response(
                    {"message": "The verification code is invalid or has expired."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            now = timezone.now()
            active_codes = PasswordResetCode.objects.filter(
                user=user,
                used_at__isnull=True,
                expires_at__gt=now,
            ).order_by("-created_at")

            matched_code = None
            normalized_code = str(code).strip()
            for entry in active_codes[:5]:
                if check_password(normalized_code, entry.code_hash):
                    matched_code = entry
                    break

            if matched_code is None:
                return Response(
                    {"message": "The verification code is invalid or has expired."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            matched_code.used_at = now
            matched_code.save(update_fields=["used_at", "updated_at"])
            PasswordResetCode.objects.filter(user=user, used_at__isnull=True).update(
                used_at=now
            )
        else:
            try:
                user_id = force_str(urlsafe_base64_decode(uid))
                user = User.objects.get(pk=user_id, is_active=True)
            except (User.DoesNotExist, TypeError, ValueError, OverflowError):
                user = None

            if not user or not default_token_generator.check_token(user, token):
                return Response(
                    {"message": "The password reset link is invalid or has expired."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        user.set_password(new_password)
        user.save(update_fields=["password"])

        return Response(
            {"message": "Password has been reset successfully. You can now sign in."},
            status=status.HTTP_200_OK,
        )


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user, context={"request": request})
        return Response(serializer.data)


class ProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ProfileSerializer

    def get_object(self):
        return self.request.user


class AddressListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AddressSerializer
    pagination_class = None

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context


class TestEmailView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        recipient = request.query_params.get("email") or request.user.email
        if not recipient:
            return Response(
                {"error": "Provide a valid email to send the test message."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            send_mail(
                subject="A-SH Store test email",
                message="This is a test email from the A-SH Store backend.",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[recipient],
                fail_silently=False,
            )
        except Exception:
            logger.exception("Failed to send test email", extra={"email": recipient})
            return Response(
                {"error": "Failed to send test email."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {"message": "Test email sent successfully."},
            status=status.HTTP_200_OK,
        )
