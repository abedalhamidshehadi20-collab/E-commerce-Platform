import { useEffect, useState } from "react";

import Button from "./Button";
import { formatDate } from "../utils/formatters";

function normalizeCouponCode(value) {
  return String(value || "").trim().toUpperCase();
}

export default function CouponInput({
  availableCoupons,
  cartTotal,
  appliedCoupon,
  couponsLoading,
  loading,
  error,
  onApply,
  onClear,
}) {
  const [code, setCode] = useState(appliedCoupon?.code || "");

  useEffect(() => {
    setCode(appliedCoupon?.code || "");
  }, [appliedCoupon?.code]);

  const handleChange = (event) => {
    const nextValue = event.target.value;
    setCode(nextValue);

    if (appliedCoupon && normalizeCouponCode(nextValue) !== appliedCoupon.code) {
      onClear();
    }
  };

  const handleApply = async (event) => {
    event.preventDefault();
    try {
      await onApply(code);
    } catch {
      // Parent state already surfaces the API error.
    }
  };

  const openCoupons = availableCoupons.filter((coupon) => coupon.status === "Available");

  return (
    <div className="coupon-panel">
      <div className="coupon-panel-header">
        <div>
          <span className="coupon-panel-kicker">Coupon code</span>
          <h4>Apply a welcome discount</h4>
        </div>
        {appliedCoupon ? <span className="coupon-applied-pill">Applied</span> : null}
      </div>

      <form className="coupon-form" onSubmit={handleApply}>
        <input
          className="field-control coupon-input-control"
          value={code}
          onChange={handleChange}
          placeholder="SAVE20"
          aria-label="Coupon code"
          disabled={loading}
        />
        <Button
          type="submit"
          variant="secondary"
          disabled={!normalizeCouponCode(code) || Number(cartTotal || 0) <= 0}
          loading={loading}
        >
          Apply
        </Button>
      </form>

      {error ? <p className="field-error coupon-feedback">{error}</p> : null}
      {appliedCoupon ? (
        <p className="page-success coupon-feedback">
          {appliedCoupon.code} applied. You saved ${appliedCoupon.discount}.
        </p>
      ) : null}

      {couponsLoading ? <p className="supporting-text coupon-feedback">Loading your coupons...</p> : null}
      {!couponsLoading && openCoupons.length ? (
        <div className="coupon-available-list">
          {openCoupons.map((coupon) => (
            <button
              key={coupon.id}
              type="button"
              className="coupon-available-card"
              onClick={() => {
                setCode(coupon.code);
                if (appliedCoupon?.code && appliedCoupon.code !== coupon.code) {
                  onClear();
                }
              }}
            >
              <strong>{coupon.code}</strong>
              <span>{coupon.discount_label}</span>
              <small>Expires {formatDate(coupon.expires_at)}</small>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
