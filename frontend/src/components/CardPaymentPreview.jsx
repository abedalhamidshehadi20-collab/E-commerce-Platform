function formatCardholderName(name) {
  const value = String(name || "").trim();
  return value ? value.toUpperCase() : "FULL NAME";
}

function formatBrandLabel(brand) {
  const normalized = String(brand || "").toLowerCase();

  if (normalized === "visa") {
    return "VISA";
  }

  if (normalized === "mastercard") {
    return "MASTERCARD";
  }

  if (normalized === "amex") {
    return "AMEX";
  }

  return "BANK";
}

export default function CardPaymentPreview({
  cardholderName = "",
  brand = "",
  maskedNumber = "0000 0000 0000 0000",
  expiryLabel = "MM/YY",
}) {
  return (
    <div className="checkout-card-preview" aria-label="Card preview">
      <div className="checkout-card-preview-top">
        <div className="checkout-card-chip" aria-hidden="true">
          <span />
          <span />
        </div>
        <div className="checkout-card-brand">
          <span className="checkout-card-brand-icon" aria-hidden="true" />
          <strong>{formatBrandLabel(brand)}</strong>
        </div>
      </div>

      <p className="checkout-card-number">{maskedNumber}</p>

      <div className="checkout-card-preview-bottom">
        <div>
          <span className="checkout-card-meta-label">Card Holder</span>
          <strong>{formatCardholderName(cardholderName)}</strong>
        </div>
        <div className="checkout-card-expiry">
          <span className="checkout-card-meta-label">Expires</span>
          <strong>{expiryLabel}</strong>
        </div>
      </div>
    </div>
  );
}
