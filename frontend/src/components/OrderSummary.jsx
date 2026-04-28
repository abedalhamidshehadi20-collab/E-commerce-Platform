import { formatCurrency } from "../utils/formatters";

export default function OrderSummary({
  items,
  totalItems,
  paymentMethod,
  subtotal,
  discount,
  finalTotal,
  couponCode,
  children,
}) {
  return (
    <aside className="summary-card checkout-summary-card">
      <div className="checkout-summary-header">
        <h3>Order summary</h3>
        <span className="checkout-summary-count">
          {totalItems} {totalItems === 1 ? "item" : "items"}
        </span>
      </div>

      <div className="checkout-summary-items">
        {items.map((item) => (
          <div key={item.id} className="summary-item checkout-summary-item">
            <span>
              {item.product.name} x {item.quantity}
            </span>
            <strong>{formatCurrency(item.line_total)}</strong>
          </div>
        ))}
      </div>

      <div className="summary-row checkout-summary-row">
        <span>Cart total</span>
        <strong>{formatCurrency(subtotal)}</strong>
      </div>

      {children}

      {couponCode ? (
        <div className="summary-row checkout-summary-row">
          <span>Coupon</span>
          <strong>{couponCode}</strong>
        </div>
      ) : null}

      {Number(discount || 0) > 0 ? (
        <div className="summary-row checkout-summary-row checkout-summary-discount">
          <span>Discount</span>
          <strong>-{formatCurrency(discount)}</strong>
        </div>
      ) : null}

      <div className="summary-row checkout-summary-row">
        <span>Payment method</span>
        <span className={`checkout-payment-chip ${paymentMethod === "cod" ? "cod" : "card"}`}>
          {paymentMethod === "cod" ? "Cash on Delivery" : "Card Payment"}
        </span>
      </div>

      <div className="summary-row checkout-summary-row checkout-summary-total">
        <span>Final total</span>
        <strong>{formatCurrency(finalTotal)}</strong>
      </div>
    </aside>
  );
}
