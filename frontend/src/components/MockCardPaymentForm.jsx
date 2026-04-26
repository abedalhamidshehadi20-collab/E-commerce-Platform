import { useEffect, useMemo, useState } from "react";

import Button from "./Button";
import CardPaymentPreview from "./CardPaymentPreview";

function detectCardBrand(number) {
  if (/^4/.test(number)) {
    return "visa";
  }

  if (/^(5[1-5]|2[2-7])/.test(number)) {
    return "mastercard";
  }

  if (/^3[47]/.test(number)) {
    return "amex";
  }

  return "";
}

function formatCardNumber(value) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function buildMaskedPreview(value) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  const safeDigits = `${digits}${"0".repeat(Math.max(0, 16 - digits.length))}`;
  const grouped = safeDigits.match(/.{1,4}/g) || [];
  return grouped.join(" ");
}

function buildYearOptions() {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 10 }, (_, index) => String(currentYear + index));
}

export default function MockCardPaymentForm({
  amountLabel,
  defaultCardholderName = "",
  loading = false,
  onSubmit,
}) {
  const [cardNumber, setCardNumber] = useState("");
  const [cardholderName, setCardholderName] = useState(defaultCardholderName);
  const [expiryMonth, setExpiryMonth] = useState("");
  const [expiryYear, setExpiryYear] = useState("");
  const [cvc, setCvc] = useState("");

  useEffect(() => {
    if (!cardholderName.trim() && defaultCardholderName) {
      setCardholderName(defaultCardholderName);
    }
  }, [cardholderName, defaultCardholderName]);

  const yearOptions = useMemo(() => buildYearOptions(), []);
  const cardBrand = useMemo(
    () => detectCardBrand(cardNumber.replace(/\s/g, "")),
    [cardNumber]
  );
  const maskedNumber = useMemo(() => buildMaskedPreview(cardNumber), [cardNumber]);
  const expiryLabel = useMemo(() => {
    if (!expiryMonth || !expiryYear) {
      return "MM/YY";
    }

    return `${expiryMonth}/${expiryYear.slice(-2)}`;
  }, [expiryMonth, expiryYear]);

  const handleConfirm = async () => {
    await onSubmit();
  };

  return (
    <div className="card-payment-form">
      <div className="card-payment-header">
        <div>
          <h3>Mock card payment</h3>
          <p>
            Local test mode is active. This form matches the production layout while still letting
            you simulate approved or declined payments safely.
          </p>
        </div>
        <span className="card-payment-badge mock">Test mode</span>
      </div>

      <div className="card-payment-grid">
        <label className="card-payment-field card-payment-field-full">
          <span>Card number</span>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="cc-number"
            className="card-payment-control"
            value={cardNumber}
            onChange={(event) => setCardNumber(formatCardNumber(event.target.value))}
            placeholder="0000 0000 0000 0000"
          />
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

        <label className="card-payment-field">
          <span>Month</span>
          <select
            className="card-payment-control"
            value={expiryMonth}
            onChange={(event) => setExpiryMonth(event.target.value)}
          >
            <option value="">MM</option>
            {Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, "0")).map(
              (month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              )
            )}
          </select>
        </label>

        <label className="card-payment-field">
          <span>Year</span>
          <select
            className="card-payment-control"
            value={expiryYear}
            onChange={(event) => setExpiryYear(event.target.value)}
          >
            <option value="">YY</option>
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year.slice(-2)}
              </option>
            ))}
          </select>
        </label>

        <label className="card-payment-field">
          <span>CVV</span>
          <input
            type="password"
            inputMode="numeric"
            autoComplete="cc-csc"
            className="card-payment-control"
            value={cvc}
            onChange={(event) => setCvc(event.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="***"
          />
        </label>
      </div>

      <div className="card-payment-preview-block">
        <span className="card-payment-preview-label">Card preview</span>
        <CardPaymentPreview
          cardholderName={cardholderName}
          brand={cardBrand}
          maskedNumber={maskedNumber}
          expiryLabel={expiryLabel}
        />
      </div>

      <Button type="button" className="stretch" loading={loading} onClick={handleConfirm}>
        Pay now
      </Button>
      <p className="card-payment-amount">Order total: {amountLabel}</p>
    </div>
  );
}
