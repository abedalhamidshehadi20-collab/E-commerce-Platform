import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import Button from "../components/Button";
import CheckoutPaymentMethodSelector from "../components/CheckoutPaymentMethodSelector";
import EmptyState from "../components/EmptyState";
import Input from "../components/Input";
import Modal from "../components/Modal";
import MockCardPaymentForm from "../components/MockCardPaymentForm";
import StripeCheckoutForm from "../components/StripeCheckoutForm";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { fetchAddresses } from "../store/slices/authSlice";
import { clearCartState } from "../store/slices/cartSlice";
import {
  checkoutOrder,
  clearPaymentSession,
  confirmPaymentSession,
  createPaymentSession,
  fetchOrders,
} from "../store/slices/ordersSlice";
import { formatCurrency } from "../utils/formatters";

const blankForm = {
  payment_method: "cod",
  addressMode: "saved",
  address_id: "",
  full_name: "",
  phone_number: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "United States",
  save_address: true,
  label: "Shipping",
  notes: "",
};

function buildCheckoutPayload(form, user) {
  if (form.addressMode === "saved" && form.address_id) {
    return {
      payment_method: form.payment_method,
      address_id: Number(form.address_id),
      notes: form.notes,
    };
  }

  return {
    payment_method: form.payment_method,
    full_name: form.full_name || user?.full_name || "",
    phone_number: form.phone_number || user?.phone_number || "",
    line1: form.line1,
    line2: form.line2,
    city: form.city,
    state: form.state,
    postal_code: form.postal_code,
    country: form.country,
    save_address: form.save_address,
    label: form.label,
    notes: form.notes,
  };
}

function validateCheckoutForm(form, addresses) {
  const errors = {};

  if (!form.payment_method) {
    errors.payment_method = "Choose a payment method.";
  }

  if (form.addressMode === "saved") {
    if (!addresses.length) {
      errors.addressMode = "Add a shipping address before continuing.";
    } else if (!form.address_id) {
      errors.address_id = "Choose one of your saved addresses.";
    }
  }

  if (form.addressMode === "new") {
    [
      "full_name",
      "phone_number",
      "line1",
      "city",
      "state",
      "postal_code",
      "country",
    ].forEach((field) => {
      if (!String(form[field] || "").trim()) {
        errors[field] = "This field is required.";
      }
    });
  }

  return errors;
}

export default function CheckoutPage() {
  useDocumentTitle("Checkout");

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const { user, addresses, addressesLoading, addressesError } = useSelector(
    (state) => state.auth
  );
  const { cart } = useSelector((state) => state.cart);
  const {
    checkoutLoading,
    selectedOrder,
    error,
    paymentSession,
    paymentSessionLoading,
    paymentConfirmLoading,
    paymentError,
  } = useSelector((state) => state.orders);

  const [form, setForm] = useState(blankForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [localError, setLocalError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [mockResult, setMockResult] = useState("succeeded");
  const formRef = useRef(null);

  useEffect(() => {
    dispatch(fetchAddresses());
  }, [dispatch]);

  useEffect(() => {
    if (addresses.length) {
      const defaultAddress = addresses.find((address) => address.is_default) || addresses[0];
      setForm((current) => ({
        ...current,
        address_id: String(defaultAddress.id),
      }));
      return;
    }

    setForm((current) => ({
      ...current,
      addressMode: "new",
      address_id: "",
    }));
  }, [addresses]);

  useEffect(() => {
    const checkoutSessionId = searchParams.get("checkout_session");
    if (!checkoutSessionId) {
      return;
    }

    const confirmReturnedPayment = async () => {
      setLocalError("");
      setStatusMessage("");

      try {
        const response = await dispatch(
          confirmPaymentSession({ checkout_session_id: checkoutSessionId })
        ).unwrap();

        if (response.order) {
          dispatch(clearCartState());
          dispatch(fetchOrders());
          dispatch(fetchAddresses());
          setCheckoutSuccess(true);
        } else if (response.status === "processing") {
          setStatusMessage(response.message);
        } else {
          setLocalError(response.message || "Payment could not be completed.");
          if (response.status === "canceled") {
            dispatch(clearPaymentSession());
          }
        }
      } catch (requestError) {
        setLocalError(requestError || "Unable to verify the payment result.");
      } finally {
        window.history.replaceState({}, "", "/checkout");
      }
    };

    confirmReturnedPayment();
  }, [dispatch, searchParams]);

  useEffect(() => {
    const hasBlockingError =
      Boolean(error) ||
      Boolean(paymentError) ||
      Boolean(localError) ||
      Boolean(addressesError) ||
      Object.keys(fieldErrors).length > 0;

    if (!hasBlockingError) {
      return;
    }

    const scrollTarget = formRef.current?.querySelector(".field-error, .page-error");
    if (typeof scrollTarget?.scrollIntoView === "function") {
      scrollTarget.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [addressesError, error, fieldErrors, localError, paymentError]);

  const orderTotal = useMemo(() => formatCurrency(cart.subtotal), [cart.subtotal]);
  const selectedSavedAddress = useMemo(
    () => addresses.find((address) => String(address.id) === form.address_id) || null,
    [addresses, form.address_id]
  );
  const defaultCardholderName = useMemo(() => {
    if (form.addressMode === "saved") {
      return selectedSavedAddress?.full_name || user?.full_name || "";
    }

    return form.full_name || user?.full_name || "";
  }, [form.addressMode, form.full_name, selectedSavedAddress, user?.full_name]);

  const invalidatePaymentState = () => {
    if (paymentSession) {
      dispatch(clearPaymentSession());
    }
    setStatusMessage("");
    setLocalError("");
  };

  const handleChange = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: "" }));

    if (key !== "notes") {
      invalidatePaymentState();
    }
  };

  const handleAddressModeChange = (mode) => {
    handleChange("addressMode", mode);
  };

  const handlePaymentMethodChange = (value) => {
    setForm((current) => ({ ...current, payment_method: value }));
    setFieldErrors((current) => ({ ...current, payment_method: "" }));
    invalidatePaymentState();
  };

  const handleSuccessfulOrder = () => {
    dispatch(clearCartState());
    dispatch(fetchOrders());
    dispatch(fetchAddresses());
    setCheckoutSuccess(true);
  };

  const handleCreateCardSession = async (payload) => {
    const response = await dispatch(createPaymentSession(payload)).unwrap();
    setStatusMessage(response.message || "Secure card payment is ready.");
    return response;
  };

  const handleConfirmMockPayment = async () => {
    if (!paymentSession?.checkout_session_id) {
      return;
    }

    setLocalError("");
    setStatusMessage("");

    try {
      const response = await dispatch(
        confirmPaymentSession({
          checkout_session_id: paymentSession.checkout_session_id,
          simulate_result: mockResult,
        })
      ).unwrap();

      if (response.order) {
        handleSuccessfulOrder();
        return;
      }

      if (response.status === "processing") {
        setStatusMessage(response.message);
        return;
      }

      if (response.status === "canceled") {
        dispatch(clearPaymentSession());
      }
      setLocalError(response.message || "Payment could not be completed.");
    } catch (requestError) {
      setLocalError(requestError || "Unable to confirm payment.");
    }
  };

  const handleStripePaymentSubmitted = async () => {
    if (!paymentSession?.checkout_session_id) {
      return;
    }

    const response = await dispatch(
      confirmPaymentSession({
        checkout_session_id: paymentSession.checkout_session_id,
      })
    ).unwrap();

    if (response.order) {
      handleSuccessfulOrder();
      return;
    }

    if (response.status === "processing") {
      setStatusMessage(response.message);
      return;
    }

    if (response.status === "canceled") {
      dispatch(clearPaymentSession());
    }
    setLocalError(response.message || "Payment could not be completed.");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLocalError("");
    setStatusMessage("");

    const nextErrors = validateCheckoutForm(form, addresses);
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      return;
    }

    const payload = buildCheckoutPayload(form, user);

    try {
      if (form.payment_method === "cod") {
        const placedOrder = await dispatch(checkoutOrder(payload)).unwrap();
        if (placedOrder) {
          handleSuccessfulOrder();
        }
        return;
      }

      await handleCreateCardSession(payload);
    } catch (requestError) {
      setLocalError(requestError || "Unable to continue checkout.");
    }
  };

  if (!cart.items.length && !checkoutSuccess) {
    return (
      <section className="container section">
        <EmptyState
          title="Your cart is empty"
          description="Add a few products before heading to checkout."
          action={<Button onClick={() => navigate("/products")}>Back to products</Button>}
        />
      </section>
    );
  }

  const showSavedAddressSelect = form.addressMode === "saved" && addresses.length;
  const showCardSection = form.payment_method === "card" && paymentSession;

  return (
    <section className="container section">
      <div className="section-header">
        <div>
          <span className="eyebrow">Checkout</span>
          <h1>Confirm shipping details and choose how you want to pay.</h1>
        </div>
      </div>

      {error || paymentError || localError || addressesError ? (
        <p className="page-error">{localError || paymentError || addressesError || error}</p>
      ) : null}
      {statusMessage ? <p className="page-success">{statusMessage}</p> : null}

      <div className="checkout-layout">
        <form ref={formRef} className="form-card" onSubmit={handleSubmit}>
          <CheckoutPaymentMethodSelector
            value={form.payment_method}
            onChange={handlePaymentMethodChange}
            error={fieldErrors.payment_method}
          />

          <div className="toggle-group">
            <button
              type="button"
              className={form.addressMode === "saved" ? "active" : ""}
              onClick={() => handleAddressModeChange("saved")}
              disabled={!addresses.length}
            >
              Saved address
            </button>
            <button
              type="button"
              className={form.addressMode === "new" ? "active" : ""}
              onClick={() => handleAddressModeChange("new")}
            >
              New address
            </button>
          </div>

          {fieldErrors.addressMode ? <p className="page-error">{fieldErrors.addressMode}</p> : null}

          {showSavedAddressSelect ? (
            <Input
              as="select"
              label="Choose saved address"
              error={fieldErrors.address_id}
              value={form.address_id}
              onChange={(event) => handleChange("address_id", event.target.value)}
              options={addresses.map((address) => ({
                value: String(address.id),
                label: `${address.full_name} - ${address.line1}, ${address.city}`,
              }))}
            />
          ) : (
            <>
              <div className="field-row">
                <Input
                  label="Full name"
                  error={fieldErrors.full_name}
                  value={form.full_name}
                  onChange={(event) => handleChange("full_name", event.target.value)}
                  placeholder={user?.full_name || "Jordan Lee"}
                />
                <Input
                  label="Phone number"
                  error={fieldErrors.phone_number}
                  value={form.phone_number}
                  onChange={(event) => handleChange("phone_number", event.target.value)}
                  placeholder={user?.phone_number || "+1 555 123 4567"}
                />
              </div>
              <Input
                label="Address line 1"
                error={fieldErrors.line1}
                value={form.line1}
                onChange={(event) => handleChange("line1", event.target.value)}
                placeholder="123 Market Street"
              />
              <Input
                label="Address line 2"
                value={form.line2}
                onChange={(event) => handleChange("line2", event.target.value)}
                placeholder="Suite 5"
              />
              <div className="field-row">
                <Input
                  label="City"
                  error={fieldErrors.city}
                  value={form.city}
                  onChange={(event) => handleChange("city", event.target.value)}
                />
                <Input
                  label="State"
                  error={fieldErrors.state}
                  value={form.state}
                  onChange={(event) => handleChange("state", event.target.value)}
                />
              </div>
              <div className="field-row">
                <Input
                  label="Postal code"
                  error={fieldErrors.postal_code}
                  value={form.postal_code}
                  onChange={(event) => handleChange("postal_code", event.target.value)}
                />
                <Input
                  label="Country"
                  error={fieldErrors.country}
                  value={form.country}
                  onChange={(event) => handleChange("country", event.target.value)}
                />
              </div>
              <div className="field-row">
                <Input
                  label="Address label"
                  value={form.label}
                  onChange={(event) => handleChange("label", event.target.value)}
                />
                <label className="checkbox-field">
                  <input
                    type="checkbox"
                    checked={form.save_address}
                    onChange={(event) => handleChange("save_address", event.target.checked)}
                  />
                  <span>Save this address for later</span>
                </label>
              </div>
            </>
          )}

          <Input
            as="textarea"
            rows="4"
            label="Order notes"
            value={form.notes}
            onChange={(event) => handleChange("notes", event.target.value)}
            placeholder="Delivery notes or preferences"
          />

          {form.payment_method === "card" ? (
            <div className="payment-panel">
              {!paymentSession ? (
                <div className="payment-panel-copy">
                  <h3>Secure card payment</h3>
                  <p>
                    Continue once to validate your shipping details. We will then load a secure
                    card form without storing raw card details on this site.
                  </p>
                  {addressesLoading ? (
                    <p className="supporting-text">
                      Loading your saved addresses. You can still continue with a new address if
                      needed.
                    </p>
                  ) : null}
                </div>
              ) : null}

              {showCardSection && paymentSession.provider === "mock" ? (
                <MockCardPaymentForm
                  amountLabel={orderTotal}
                  defaultCardholderName={defaultCardholderName}
                  loading={paymentConfirmLoading}
                  onSubmit={handleConfirmMockPayment}
                  simulateResult={mockResult}
                  onSimulateResultChange={setMockResult}
                />
              ) : null}

              {showCardSection && paymentSession.provider === "stripe" ? (
                <StripeCheckoutForm
                  paymentSession={paymentSession}
                  amountLabel={orderTotal}
                  defaultCardholderName={defaultCardholderName}
                  onPaymentSubmitted={handleStripePaymentSubmitted}
                  loading={paymentConfirmLoading}
                />
              ) : null}
            </div>
          ) : null}

          {!showCardSection ? (
            <Button
              type="submit"
              className="stretch"
              loading={checkoutLoading || paymentSessionLoading || paymentConfirmLoading}
            >
              {form.payment_method === "cod"
                ? "Place order"
                : "Continue to secure card payment"}
            </Button>
          ) : null}
        </form>

        <aside className="summary-card checkout-summary-card">
          <div className="checkout-summary-header">
            <h3>Order summary</h3>
            <span className="checkout-summary-count">
              {cart.total_items} {cart.total_items === 1 ? "item" : "items"}
            </span>
          </div>

          <div className="checkout-summary-items">
            {cart.items.map((item) => (
              <div key={item.id} className="summary-item checkout-summary-item">
                <span>
                  {item.product.name} x {item.quantity}
                </span>
                <strong>{formatCurrency(item.line_total)}</strong>
              </div>
            ))}
          </div>

          <div className="summary-row checkout-summary-row">
            <span>Payment method</span>
            <span className={`checkout-payment-chip ${form.payment_method === "cod" ? "cod" : "card"}`}>
              {form.payment_method === "cod" ? "Cash on Delivery" : "Card Payment"}
            </span>
          </div>

          <div className="summary-row checkout-summary-row checkout-summary-total">
            <span>Total</span>
            <strong>{orderTotal}</strong>
          </div>
        </aside>
      </div>

      <Modal
        open={checkoutSuccess}
        title="Order placed successfully"
        actionLabel="Go to orders"
        onClose={() => {
          setCheckoutSuccess(false);
          dispatch(clearPaymentSession());
          navigate("/orders");
        }}
      >
        <div className="checkout-success-copy">
          <p className="checkout-success-message">
            {selectedOrder?.payment_method === "card"
              ? "Your payment was confirmed and the order has been placed."
              : "Your order has been placed and the cart has been cleared."}
          </p>
          {selectedOrder ? (
            <div className="checkout-order-reference">
              <span>Order reference</span>
              <strong>{selectedOrder.order_number}</strong>
            </div>
          ) : null}
        </div>
      </Modal>
    </section>
  );
}
