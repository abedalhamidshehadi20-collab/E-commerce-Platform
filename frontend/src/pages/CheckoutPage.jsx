import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import Button from "../components/Button";
import EmptyState from "../components/EmptyState";
import Input from "../components/Input";
import Modal from "../components/Modal";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { fetchAddresses } from "../store/slices/authSlice";
import { clearCartState } from "../store/slices/cartSlice";
import { checkoutOrder, fetchOrders } from "../store/slices/ordersSlice";
import { formatCurrency } from "../utils/formatters";

const blankForm = {
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

export default function CheckoutPage() {
  useDocumentTitle("Checkout");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, addresses, addressesLoading } = useSelector((state) => state.auth);
  const { cart } = useSelector((state) => state.cart);
  const { checkoutLoading, selectedOrder, error } = useSelector((state) => state.orders);
  const [form, setForm] = useState(blankForm);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [localError, setLocalError] = useState("");

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
    } else {
      setForm((current) => ({
        ...current,
        addressMode: "new",
      }));
    }
  }, [addresses]);

  const orderTotal = useMemo(() => formatCurrency(cart.subtotal), [cart.subtotal]);

  const handleChange = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLocalError("");

    const payload =
      form.addressMode === "saved" && form.address_id
        ? { address_id: Number(form.address_id), notes: form.notes }
        : {
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

    try {
      const placedOrder = await dispatch(checkoutOrder(payload)).unwrap();

      dispatch(clearCartState());
      dispatch(fetchOrders());
      dispatch(fetchAddresses());
      setCheckoutSuccess(Boolean(placedOrder));
    } catch (requestError) {
      setLocalError(requestError || "Unable to complete checkout.");
    }
  };

  if (!cart.items.length) {
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

  return (
    <section className="container section">
      <div className="section-header">
        <div>
          <span className="eyebrow">Checkout</span>
          <h1>Confirm shipping details and place the order securely.</h1>
        </div>
      </div>

      {error || localError ? <p className="page-error">{localError || error}</p> : null}

      <div className="checkout-layout">
        <form className="form-card" onSubmit={handleSubmit}>
          <div className="toggle-group">
            <button
              type="button"
              className={form.addressMode === "saved" ? "active" : ""}
              onClick={() => handleChange("addressMode", "saved")}
              disabled={!addresses.length}
            >
              Saved address
            </button>
            <button
              type="button"
              className={form.addressMode === "new" ? "active" : ""}
              onClick={() => handleChange("addressMode", "new")}
            >
              New address
            </button>
          </div>

          {form.addressMode === "saved" && addresses.length ? (
            <Input
              as="select"
              label="Choose saved address"
              value={form.address_id}
              onChange={(event) => handleChange("address_id", event.target.value)}
              options={(addresses.length ? addresses : [{ id: "", full_name: "No saved addresses", line1: "", city: "" }]).map((address) => ({
                value: String(address.id),
                label: address.id
                  ? `${address.full_name} • ${address.line1}, ${address.city}`
                  : "No saved addresses available",
              }))}
            />
          ) : (
            <>
              <div className="field-row">
                <Input
                  label="Full name"
                  value={form.full_name}
                  onChange={(event) => handleChange("full_name", event.target.value)}
                  placeholder={user?.full_name || "Jordan Lee"}
                />
                <Input
                  label="Phone number"
                  value={form.phone_number}
                  onChange={(event) => handleChange("phone_number", event.target.value)}
                  placeholder={user?.phone_number || "+1 555 123 4567"}
                />
              </div>
              <Input
                label="Address line 1"
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
                  value={form.city}
                  onChange={(event) => handleChange("city", event.target.value)}
                />
                <Input
                  label="State"
                  value={form.state}
                  onChange={(event) => handleChange("state", event.target.value)}
                />
              </div>
              <div className="field-row">
                <Input
                  label="Postal code"
                  value={form.postal_code}
                  onChange={(event) => handleChange("postal_code", event.target.value)}
                />
                <Input
                  label="Country"
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

          <Button type="submit" className="stretch" loading={checkoutLoading || addressesLoading}>
            Place order
          </Button>
        </form>

        <aside className="summary-card">
          <h3>Order summary</h3>
          {cart.items.map((item) => (
            <div key={item.id} className="summary-item">
              <span>
                {item.product.name} × {item.quantity}
              </span>
              <strong>{formatCurrency(item.line_total)}</strong>
            </div>
          ))}
          <div className="summary-row">
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
          navigate("/orders");
        }}
      >
        <p>Your order has been placed and the cart has been cleared.</p>
        {selectedOrder ? <p>Order reference: {selectedOrder.order_number}</p> : null}
      </Modal>
    </section>
  );
}
