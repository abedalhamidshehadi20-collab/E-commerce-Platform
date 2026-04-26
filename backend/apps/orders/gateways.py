from dataclasses import dataclass

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.utils import timezone

from .models import CheckoutSession

try:
    import stripe
except ImportError:  # pragma: no cover - handled by configuration tests.
    stripe = None


@dataclass
class PaymentGatewayResult:
    provider: str
    status: str
    payment_id: str = ""
    client_secret: str = ""
    last_error_code: str = ""
    last_error_message: str = ""
    confirmed_at: object = None


class PaymentGatewayError(Exception):
    def __init__(self, public_message):
        super().__init__(public_message)
        self.public_message = public_message


class BasePaymentGateway:
    provider = CheckoutSession.Provider.MOCK

    def get_publishable_key(self):
        return ""

    def get_client_secret(self, payment_session):
        return ""

    def create_payment_session(self, payment_session, user):
        raise NotImplementedError

    def sync_payment_session(self, payment_session, simulate_result=""):
        raise NotImplementedError

    def cancel_payment(self, payment_session):
        return None

    def refund_payment(self, payment_session):
        return None


class MockPaymentGateway(BasePaymentGateway):
    provider = CheckoutSession.Provider.MOCK

    def create_payment_session(self, payment_session, user):
        return PaymentGatewayResult(
            provider=self.provider,
            status=CheckoutSession.Status.REQUIRES_PAYMENT_METHOD,
            payment_id=f"mock_pi_{payment_session.public_id.hex[:24]}",
            client_secret=f"mock_secret_{payment_session.public_id.hex}",
        )

    def get_client_secret(self, payment_session):
        return f"mock_secret_{payment_session.public_id.hex}"

    def sync_payment_session(self, payment_session, simulate_result=""):
        outcome = (simulate_result or "").strip().lower()
        if outcome == "failed":
            return PaymentGatewayResult(
                provider=self.provider,
                status=CheckoutSession.Status.REQUIRES_PAYMENT_METHOD,
                payment_id=payment_session.provider_payment_id,
                last_error_code="mock_declined",
                last_error_message="The test card was declined. Please try another card.",
            )

        if outcome == "canceled":
            return PaymentGatewayResult(
                provider=self.provider,
                status=CheckoutSession.Status.CANCELED,
                payment_id=payment_session.provider_payment_id,
                last_error_code="mock_canceled",
                last_error_message="Payment was canceled before it completed.",
            )

        if outcome == "timeout":
            return PaymentGatewayResult(
                provider=self.provider,
                status=CheckoutSession.Status.PROCESSING,
                payment_id=payment_session.provider_payment_id,
                last_error_code="mock_timeout",
                last_error_message="Payment confirmation is taking longer than expected.",
            )

        return PaymentGatewayResult(
            provider=self.provider,
            status=CheckoutSession.Status.SUCCEEDED,
            payment_id=payment_session.provider_payment_id,
            confirmed_at=timezone.now(),
        )


class StripePaymentGateway(BasePaymentGateway):
    provider = CheckoutSession.Provider.STRIPE

    def __init__(self):
        if stripe is None:
            raise ImproperlyConfigured("Stripe SDK is not installed.")
        if not settings.STRIPE_SECRET_KEY:
            raise ImproperlyConfigured("STRIPE_SECRET_KEY is required for Stripe payments.")
        self.client = stripe.StripeClient(settings.STRIPE_SECRET_KEY)

    def get_publishable_key(self):
        return settings.STRIPE_PUBLISHABLE_KEY

    def _to_minor_units(self, amount):
        return int((amount * 100).quantize(1))

    def _map_status(self, payment_intent):
        status = payment_intent.status
        last_payment_error = getattr(payment_intent, "last_payment_error", None)
        error_code = getattr(last_payment_error, "code", "") or ""
        error_message = getattr(last_payment_error, "message", "") or ""

        if status == "succeeded":
            confirmed_at = timezone.now()
            return PaymentGatewayResult(
                provider=self.provider,
                status=CheckoutSession.Status.SUCCEEDED,
                payment_id=payment_intent.id,
                client_secret=getattr(payment_intent, "client_secret", "") or "",
                confirmed_at=confirmed_at,
            )

        if status == "processing":
            return PaymentGatewayResult(
                provider=self.provider,
                status=CheckoutSession.Status.PROCESSING,
                payment_id=payment_intent.id,
                client_secret=getattr(payment_intent, "client_secret", "") or "",
            )

        if status == "requires_action":
            return PaymentGatewayResult(
                provider=self.provider,
                status=CheckoutSession.Status.REQUIRES_ACTION,
                payment_id=payment_intent.id,
                client_secret=getattr(payment_intent, "client_secret", "") or "",
            )

        if status == "canceled":
            return PaymentGatewayResult(
                provider=self.provider,
                status=CheckoutSession.Status.CANCELED,
                payment_id=payment_intent.id,
                client_secret=getattr(payment_intent, "client_secret", "") or "",
                last_error_code=error_code or "payment_canceled",
                last_error_message=error_message or "Payment was canceled before completion.",
            )

        return PaymentGatewayResult(
            provider=self.provider,
            status=CheckoutSession.Status.REQUIRES_PAYMENT_METHOD,
            payment_id=payment_intent.id,
            client_secret=getattr(payment_intent, "client_secret", "") or "",
            last_error_code=error_code or "payment_failed",
            last_error_message=error_message or "Payment could not be completed. Please try another card.",
        )

    def create_payment_session(self, payment_session, user):
        try:
            payment_intent = self.client.v1.payment_intents.create(
                params={
                    "amount": self._to_minor_units(payment_session.total_price),
                    "currency": payment_session.currency,
                    "payment_method_types": ["card"],
                    "metadata": {
                        "checkout_session_id": str(payment_session.public_id),
                        "user_id": str(user.id),
                    },
                    "receipt_email": user.email or None,
                },
                options={"idempotency_key": payment_session.idempotency_key},
            )
        except stripe.error.StripeError as exc:  # pragma: no cover - exercised via mocks.
            raise PaymentGatewayError(
                "Unable to start secure card payment right now. Please try again."
            ) from exc

        return self._map_status(payment_intent)

    def get_client_secret(self, payment_session):
        if not payment_session.provider_payment_id:
            return ""

        try:
            payment_intent = self.client.v1.payment_intents.retrieve(
                payment_session.provider_payment_id
            )
        except stripe.error.StripeError as exc:  # pragma: no cover - exercised via mocks.
            raise PaymentGatewayError(
                "Unable to resume secure card payment right now. Please refresh and try again."
            ) from exc

        return getattr(payment_intent, "client_secret", "") or ""

    def sync_payment_session(self, payment_session, simulate_result=""):
        try:
            payment_intent = self.client.v1.payment_intents.retrieve(
                payment_session.provider_payment_id
            )
        except stripe.error.StripeError as exc:  # pragma: no cover - exercised via mocks.
            raise PaymentGatewayError(
                "Unable to verify payment right now. Please wait a moment and try again."
            ) from exc

        return self._map_status(payment_intent)

    def cancel_payment(self, payment_session):
        if not payment_session.provider_payment_id:
            return None

        try:
            self.client.v1.payment_intents.cancel(payment_session.provider_payment_id)
        except stripe.error.StripeError:
            return None
        return None

    def refund_payment(self, payment_session):
        if not payment_session.provider_payment_id:
            return None

        try:
            self.client.v1.refunds.create(
                params={
                    "payment_intent": payment_session.provider_payment_id,
                    "metadata": {"checkout_session_id": str(payment_session.public_id)},
                },
                options={"idempotency_key": f"refund-{payment_session.idempotency_key}"},
            )
        except stripe.error.StripeError as exc:  # pragma: no cover - exercised via mocks.
            raise PaymentGatewayError("Unable to automatically reverse the payment.") from exc
        return None


def get_payment_gateway():
    provider = settings.PAYMENT_PROVIDER.lower()
    if provider == CheckoutSession.Provider.STRIPE:
        return StripePaymentGateway()
    return MockPaymentGateway()
