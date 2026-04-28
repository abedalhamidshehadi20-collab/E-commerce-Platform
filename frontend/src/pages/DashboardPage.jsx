import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import LoadingSpinner from "../components/LoadingSpinner";
import StatusBadge from "../components/StatusBadge";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { fetchCoupons } from "../store/slices/couponsSlice";
import { fetchOrders } from "../store/slices/ordersSlice";
import { formatCurrency, formatDate } from "../utils/formatters";

export default function DashboardPage() {
  useDocumentTitle("Dashboard");
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { cart } = useSelector((state) => state.cart);
  const { list, loading } = useSelector((state) => state.orders);
  const { list: coupons, loading: couponsLoading, error: couponsError } = useSelector(
    (state) => state.coupons
  );
  const availableCoupons = coupons.filter((coupon) => coupon.status === "Available");

  useEffect(() => {
    dispatch(fetchOrders());
    dispatch(fetchCoupons());
  }, [dispatch]);

  return (
    <section className="container section dashboard-section">
      <div className="section-header dashboard-header">
        <div>
          <span className="eyebrow">Dashboard</span>
          <h1>Everything important for your account is gathered here.</h1>
        </div>
      </div>

      <div className="stats-grid dashboard-stats-grid">
        <div className="stat-card dashboard-stat-card">
          <span className="dashboard-stat-label">Customer</span>
          <strong>{user?.full_name || user?.email}</strong>
          <p>Keep your profile updated for faster checkout.</p>
        </div>
        <div className="stat-card dashboard-stat-card">
          <span className="dashboard-stat-label">Open cart items</span>
          <strong>{cart.total_items || 0}</strong>
          <p>Items saved and ready for checkout.</p>
        </div>
        <div className="stat-card dashboard-stat-card">
          <span className="dashboard-stat-label">Total orders</span>
          <strong>{list.length}</strong>
          <p>Your complete purchase history in one place.</p>
        </div>
        <div className="stat-card dashboard-stat-card">
          <span className="dashboard-stat-label">Available coupons</span>
          <strong>{availableCoupons.length}</strong>
          <p>Rewards ready to use before they expire.</p>
        </div>
      </div>

      <div className="dashboard-grid dashboard-content-grid">
        <div className="panel-card dashboard-panel">
          <div className="panel-card-header dashboard-panel-header">
            <h3>Recent orders</h3>
            <Link className="text-link" to="/orders">
              View all
            </Link>
          </div>
          {loading ? <LoadingSpinner label="Loading orders..." /> : null}
          {!loading && !list.length ? (
            <p className="supporting-text">You haven’t placed an order yet.</p>
          ) : null}
          <div className="order-preview-list dashboard-order-list">
            {list.slice(0, 3).map((order) => (
              <div className="order-preview-item dashboard-order-item" key={order.id}>
                <div className="dashboard-order-meta">
                  <strong>{order.order_number}</strong>
                  <p>{formatDate(order.created_at)}</p>
                </div>
                <div className="align-right dashboard-order-right">
                  <StatusBadge status={order.status} />
                  <strong>{formatCurrency(order.total_price)}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel-card dashboard-panel">
          <div className="panel-card-header dashboard-panel-header">
            <h3>Quick actions</h3>
          </div>
          <div className="action-stack dashboard-action-stack">
            <Link className="action-link-card dashboard-action-link" to="/products">
              Browse products
            </Link>
            <Link className="action-link-card dashboard-action-link" to="/profile">
              Update profile
            </Link>
            <Link className="action-link-card dashboard-action-link" to="/cart">
              Review cart
            </Link>
          </div>
        </div>

        <div className="panel-card dashboard-panel">
          <div className="panel-card-header dashboard-panel-header">
            <h3>My coupons</h3>
          </div>
          {couponsLoading ? <LoadingSpinner label="Loading coupons..." /> : null}
          {!couponsLoading && couponsError ? <p className="page-error">{couponsError}</p> : null}
          {!couponsLoading && !coupons.length ? (
            <p className="supporting-text">Your account rewards will appear here.</p>
          ) : null}
          <div className="dashboard-coupon-list">
            {coupons.map((coupon) => (
              <div className="dashboard-coupon-card" key={coupon.id}>
                <div className="dashboard-coupon-top">
                  <strong>{coupon.code}</strong>
                  <span className={`dashboard-coupon-status ${coupon.status.toLowerCase()}`}>
                    {coupon.status}
                  </span>
                </div>
                <p>{coupon.discount_label}</p>
                <small>Expires {formatDate(coupon.expires_at)}</small>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
