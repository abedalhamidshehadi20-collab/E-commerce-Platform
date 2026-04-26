import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import Button from "../components/Button";
import EmptyState from "../components/EmptyState";
import LoadingSpinner from "../components/LoadingSpinner";
import StatusBadge from "../components/StatusBadge";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { fetchOrderById, fetchOrders } from "../store/slices/ordersSlice";
import { formatCurrency, formatDate } from "../utils/formatters";

export default function OrdersPage() {
  useDocumentTitle("Orders");
  const dispatch = useDispatch();
  const { list, selectedOrder, loading, detailLoading, error } = useSelector(
    (state) => state.orders
  );
  const [openOrderId, setOpenOrderId] = useState(null);

  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

  const handleViewOrder = async (orderId) => {
    if (openOrderId === orderId) {
      setOpenOrderId(null);
      return;
    }

    setOpenOrderId(orderId);
    dispatch(fetchOrderById(orderId));
  };

  if (loading) {
    return (
      <section className="container section">
        <LoadingSpinner label="Loading your orders..." />
      </section>
    );
  }

  if (!list.length) {
    return (
      <section className="container section">
        <EmptyState
          title="No orders yet"
          description="Orders will appear here as soon as you complete checkout."
        />
      </section>
    );
  }

  return (
    <section className="container section orders-page">
      <div className="section-header">
        <div>
          <span className="eyebrow">Orders</span>
          <h1>Track every order with clear totals and live status labels.</h1>
        </div>
      </div>

      {error ? <p className="page-error">{error}</p> : null}

      <div className="order-list orders-list">
        {list.map((order) => (
          <article className="order-card orders-card" key={order.id}>
            <div className="order-card-top orders-card-top">
              <div className="orders-card-ident">
                <strong>{order.order_number}</strong>
                <p>Placed on {formatDate(order.created_at)}</p>
              </div>
              <div className="align-right orders-card-total">
                <StatusBadge status={order.status} />
                <span className="orders-card-payment">
                  {String(order.payment_method || "cod").replace(/_/g, " ")} /{" "}
                  {String(order.payment_status || "unpaid").replace(/_/g, " ")}
                </span>
                <strong>{formatCurrency(order.total_price)}</strong>
              </div>
            </div>
            <div className="order-card-bottom orders-card-bottom">
              <span className="orders-card-items">
                {order.items_count ?? order.items?.length ?? 0} item(s)
              </span>
              <Button
                variant="secondary"
                className="orders-toggle-button"
                onClick={() => handleViewOrder(order.id)}
              >
                {openOrderId === order.id ? "Hide details" : "View details"}
              </Button>
            </div>

            {openOrderId === order.id ? (
              <div className="order-detail-panel orders-detail-panel">
                {detailLoading && selectedOrder?.id !== order.id ? (
                  <LoadingSpinner label="Loading order detail..." />
                ) : null}
                {selectedOrder?.id === order.id ? (
                  <>
                    <div className="detail-columns orders-detail-columns">
                      <section className="orders-detail-card">
                        <h4>Shipping</h4>
                        <p className="orders-detail-row">
                          <span className="orders-detail-label">Name:</span>
                          <strong className="orders-detail-value">
                            {selectedOrder.shipping_full_name || "Not set"}
                          </strong>
                        </p>
                        <p className="orders-detail-row">
                          <span className="orders-detail-label">Phone:</span>
                          <span className="orders-detail-value">
                            {selectedOrder.shipping_phone_number || "Not set"}
                          </span>
                        </p>
                        <p className="orders-detail-row">
                          <span className="orders-detail-label">Line 1:</span>
                          <span className="orders-detail-value">
                            {selectedOrder.shipping_line1 || "Not set"}
                          </span>
                        </p>
                        {selectedOrder.shipping_line2 ? (
                          <p className="orders-detail-row">
                            <span className="orders-detail-label">Line 2:</span>
                            <span className="orders-detail-value">{selectedOrder.shipping_line2}</span>
                          </p>
                        ) : null}
                        <p className="orders-detail-row">
                          <span className="orders-detail-label">City/State:</span>
                          <span className="orders-detail-value">
                            {[
                              [selectedOrder.shipping_city, selectedOrder.shipping_state]
                                .filter(Boolean)
                                .join(", "),
                              selectedOrder.shipping_postal_code,
                            ]
                              .filter(Boolean)
                              .join(" ") || "Not set"}
                          </span>
                        </p>
                        <p className="orders-detail-row">
                          <span className="orders-detail-label">Country:</span>
                          <span className="orders-detail-value">
                            {selectedOrder.shipping_country || "Not set"}
                          </span>
                        </p>
                      </section>
                      <section className="orders-detail-card orders-summary-card">
                        <h4>Summary</h4>
                        <p className="orders-detail-row">
                          <span className="orders-detail-label">Payment method:</span>
                          <strong className="orders-detail-value">
                            {String(selectedOrder.payment_method || "cod").replace(/_/g, " ")}
                          </strong>
                        </p>
                        <p className="orders-detail-row">
                          <span className="orders-detail-label">Payment status:</span>
                          <strong className="orders-detail-value">
                            {String(selectedOrder.payment_status || "unpaid").replace(/_/g, " ")}
                          </strong>
                        </p>
                        {selectedOrder.transaction_reference ? (
                          <p className="orders-detail-row">
                            <span className="orders-detail-label">Transaction:</span>
                            <strong className="orders-detail-value">
                              {selectedOrder.transaction_reference}
                            </strong>
                          </p>
                        ) : null}
                        <p className="orders-detail-row">
                          <span className="orders-detail-label">Subtotal:</span>
                          <strong className="orders-detail-value">
                            {formatCurrency(selectedOrder.subtotal)}
                          </strong>
                        </p>
                        <p className="orders-detail-row">
                          <span className="orders-detail-label">Shipping:</span>
                          <strong className="orders-detail-value">
                            {formatCurrency(selectedOrder.shipping_cost)}
                          </strong>
                        </p>
                        <p className="orders-detail-row">
                          <span className="orders-detail-label">Total:</span>
                          <strong className="orders-detail-value">
                            {formatCurrency(selectedOrder.total_price)}
                          </strong>
                        </p>
                      </section>
                    </div>
                    <div className="order-items-list orders-items-list">
                      {selectedOrder.items.map((item) => (
                        <div className="order-item-row orders-item-row" key={item.id}>
                          <span className="orders-item-name">{item.product_name}</span>
                          <div className="orders-item-meta">
                            <span className="orders-item-qty">Qty: {item.quantity}</span>
                            <strong>{formatCurrency(item.line_total)}</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
