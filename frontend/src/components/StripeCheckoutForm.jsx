import { useEffect, useMemo, useState } from "react";
import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  Elements,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

import Button from "./Button";
import CardPaymentPreview from "./CardPaymentPreview";

const stripePromiseCache = new Map();

const stripeElementOptions = {
  style: {
    base: {
      color: "#16263f",
      fontFamily:
        'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: "16px",
      fontSmoothing: "antialiased",
      "::placeholder": {
        color: "#93a0b6",
      },
    },
    invalid: {
      color: "#d65a5a",
      iconColor: "#d65a5a",
    },
  },
};

function getStripePromise(publishableKey) {
  if (!publishableKey) {
    return null;
  }

  if (!stripePromiseCache.has(publishableKey)) {
    stripePromiseCache.set(publishableKey, loadStripe(publishableKey));
  }

  return stripePromiseCache.get(publishableKey);
}

function StripeFieldShell({ children, className = "", focused = false, hasError = false }) {
  const classes = [
    "card-payment-control",
    "stripe-field-shell",
    className,
    focused ? "is-focused" : "",
    hasError ? "has-error" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return <div className={classes}>{children}</div>;
}

function StripePaymentFormBody({
  checkoutSessionId,
  amountLabel,
  defaultCardholderName = "",
  onPaymentSubmitted,
  loading = false,
  paymentSession,
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [localError, setLocalError] = useState("");
  const [cardholderName, setCardholderName] = useState(defaultCardholderName);
  const [cardBrand, setCardBrand] = useState("");
  const [focusedField, setFocusedField] = useState("");

  useEffect(() => {
    if (!cardholderName.trim() && defaultCardholderName) {
      setCardholderName(defaultCardholderName);
    }
  }, [cardholderName, defaultCardholderName]);

  const handleSubmit = async () => {
    setLocalError("");

    if (!stripe || !elements) {
      return;
    }

    const trimmedName = cardholderName.trim();
    if (!trimmedName) {
      setLocalError("Enter the cardholder name before continuing.");
      return;
    }

    const cardNumberElement = elements.getElement(CardNumberElement);
    if (!cardNumberElement) {
      setLocalError("Secure card entry is still loading. Please try again.");
      return;
    }

    const { error } = await stripe.confirmCardPayment(paymentSession.client_secret, {
      payment_method: {
        card: cardNumberElement,
        billing_details: {
          name: trimmedName,
        },
      },
    });

    if (error) {
      setLocalError(error.message || "Payment could not be completed.");
      return;
    }

    await onPaymentSubmitted({
      checkout_session_id: checkoutSessionId,
    });
  };

  const handleElementChange = (fieldName, event) => {
    if (fieldName === "cardNumber") {
      setCardBrand(event.brand || "");
    }

    if (event.error) {
      setLocalError(event.error.message || "Please check your card details.");
      return;
    }

    if (localError) {
      setLocalError("");
    }
  };

  const cardPreviewNumber = useMemo(() => {
    if (cardBrand) {
      return "4242 4242 4242 4242";
    }

    return "0000 0000 0000 0000";
  }, [cardBrand]);

  return (
    <div className="card-payment-form">
      <div className="card-payment-header">
        <div>
          <h3>Secure card payment</h3>
          <p>
            Enter your bank card details below. Payment is processed securely by Stripe without
            storing raw card data on this site.
          </p>
        </div>
        <span className="card-payment-badge stripe">Secured by Stripe</span>
      </div>

      <div className="card-payment-grid">
        <label className="card-payment-field card-payment-field-full">
          <span>Card number</span>
          <StripeFieldShell focused={focusedField === "cardNumber"} hasError={Boolean(localError)}>
            <CardNumberElement
              options={stripeElementOptions}
              onChange={(event) => handleElementChange("cardNumber", event)}
              onFocus={() => setFocusedField("cardNumber")}
              onBlur={() => setFocusedField("")}
            />
          </StripeFieldShell>
        </label>

        <label className="card-payment-field card-payment-field-full">
          <span>Cardholder name</span>
          <input
            type="text"
            autoComplete="cc-name"
            className="card-payment-control"
            value={cardholderName}
            onChange={(event) => setCardholderName(event.target.value)}
            placeholder="JOHN DOE"
          />
        </label>

        <label className="card-payment-field card-payment-field-span-2">
          <span>Expiry date</span>
          <StripeFieldShell focused={focusedField === "expiry"} hasError={Boolean(localError)}>
            <CardExpiryElement
              options={stripeElementOptions}
              onChange={(event) => handleElementChange("expiry", event)}
              onFocus={() => setFocusedField("expiry")}
              onBlur={() => setFocusedField("")}
            />
          </StripeFieldShell>
        </label>

        <label className="card-payment-field">
          <span>CVV</span>
          <StripeFieldShell focused={focusedField === "cvc"} hasError={Boolean(localError)}>
            <CardCvcElement
              options={stripeElementOptions}
              onChange={(event) => handleElementChange("cvc", event)}
              onFocus={() => setFocusedField("cvc")}
              onBlur={() => setFocusedField("")}
            />
          </StripeFieldShell>
        </label>
      </div>

      <div className="card-payment-preview-block">
        <span className="card-payment-preview-label">Card preview</span>
        <CardPaymentPreview
          cardholderName={cardholderName}
          brand={cardBrand}
          maskedNumber={cardPreviewNumber}
        />
      </div>

      {localError ? <p className="page-error">{localError}</p> : null}

      <Button
        type="button"
        className="stretch"
        loading={loading}
        disabled={!stripe || !elements}
        onClick={handleSubmit}
      >
        Pay now
      </Button>
      <p className="card-payment-amount">Order total: {amountLabel}</p>
    </div>
  );
}

export default function StripeCheckoutForm({
  paymentSession,
  amountLabel,
  defaultCardholderName = "",
  onPaymentSubmitted,
  loading = false,
}) {
  const stripePromise = useMemo(
    () => getStripePromise(paymentSession?.publishable_key),
    [paymentSession?.publishable_key]
  );

  const options = useMemo(
    () => ({
      clientSecret: paymentSession?.client_secret,
    }),
    [paymentSession?.client_secret]
  );

  if (!paymentSession?.client_secret || !paymentSession?.publishable_key || !stripePromise) {
    return (
      <p className="page-error">
        Secure card payment is not configured correctly. Please contact support or use cash on
        delivery.
      </p>
    );
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <StripePaymentFormBody
        checkoutSessionId={paymentSession.checkout_session_id}
        amountLabel={amountLabel}
        defaultCardholderName={defaultCardholderName}
        onPaymentSubmitted={onPaymentSubmitted}
        loading={loading}
        paymentSession={paymentSession}
      />
    </Elements>
  );
}
