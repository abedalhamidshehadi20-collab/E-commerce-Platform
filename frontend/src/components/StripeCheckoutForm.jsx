import { useMemo, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

import Button from "./Button";

const stripePromiseCache = new Map();

function getStripePromise(publishableKey) {
  if (!publishableKey) {
    return null;
  }

  if (!stripePromiseCache.has(publishableKey)) {
    stripePromiseCache.set(publishableKey, loadStripe(publishableKey));
  }

  return stripePromiseCache.get(publishableKey);
}

function StripePaymentFormBody({
  checkoutSessionId,
  amountLabel,
  onPaymentSubmitted,
  loading = false,
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [localError, setLocalError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLocalError("");

    if (!stripe || !elements) {
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout?checkout_session=${checkoutSessionId}`,
      },
      redirect: "if_required",
    });

    if (error) {
      setLocalError(error.message || "Payment could not be completed.");
      return;
    }

    await onPaymentSubmitted();
  };

  return (
    <form className="payment-element-shell" onSubmit={handleSubmit}>
      <PaymentElement
        options={{ layout: "accordion" }}
        onChange={(event) => {
          if (!event.error && localError) {
            setLocalError("");
          }
        }}
      />
      {localError ? <p className="page-error">{localError}</p> : null}
      <Button type="submit" className="stretch" loading={loading} disabled={!stripe || !elements}>
        Pay {amountLabel} securely
      </Button>
    </form>
  );
}

export default function StripeCheckoutForm({
  paymentSession,
  amountLabel,
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
      appearance: {
        theme: "stripe",
        variables: {
          colorPrimary: "#3f72db",
          colorBackground: "#ffffff",
          colorText: "#112033",
          colorDanger: "#d65a5a",
          borderRadius: "16px",
        },
      },
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
        onPaymentSubmitted={onPaymentSubmitted}
        loading={loading}
      />
    </Elements>
  );
}
