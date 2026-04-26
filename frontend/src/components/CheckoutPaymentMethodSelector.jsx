const paymentOptions = [
  {
    value: "cod",
    label: "Cash on Delivery",
    description: "Pay when the order arrives. Your order will be placed as unpaid.",
  },
  {
    value: "card",
    label: "Card Payment",
    description: "Pay securely with Visa, Mastercard, or another officially issued bank card.",
  },
];

export default function CheckoutPaymentMethodSelector({
  value,
  onChange,
  error = "",
}) {
  return (
    <div className="field payment-method-field">
      <span className="field-label">Payment method</span>
      <div className="payment-method-grid" role="radiogroup" aria-label="Payment method">
        {paymentOptions.map((option) => {
          const checked = value === option.value;
          return (
            <label
              key={option.value}
              className={`payment-method-card ${checked ? "active" : ""}`.trim()}
            >
              <input
                type="radio"
                name="payment_method"
                value={option.value}
                checked={checked}
                onChange={(event) => onChange(event.target.value)}
              />
              <div>
                <strong>{option.label}</strong>
                <p>{option.description}</p>
              </div>
            </label>
          );
        })}
      </div>
      {error ? <span className="field-error">{error}</span> : null}
    </div>
  );
}
