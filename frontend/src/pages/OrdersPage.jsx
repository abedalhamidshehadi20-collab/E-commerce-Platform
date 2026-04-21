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
    <section className="container section">
      <div className="section-header">
        <div>
          <span className="eyebrow">Orders</span>
          <h1>Track every order with clear totals and live status labels.</h1>
        </div>
      </div>

      {error ? <p className="page-error">{error}</p> : null}

      <div className="order-list">
        {list.map((order) => (
          <article className="order-card" key={order.id}>
            <div className="order-card-top">
              <div>
                <strong>{order.order_number}</strong>
                <p>Placed on {formatDate(order.created_at)}</p>
              </div>
              <div className="align-right">
                <StatusBadge status={order.status} />
                <strong>{formatCurrency(order.total_price)}</strong>
              </div>
            </div>
              <div className="order-card-bottom">
              <span>{order.items_count ?? order.items?.length ?? 0} item(s)</span>
              <Button variant="secondary" onClick={() => handleViewOrder(order.id)}>
                {openOrderId === order.id ? "Hide details" : "View details"}
              </Button>
            </div>

            {openOrderId === order.id ? (
              <div className="order-detail-panel">
                {detailLoading && selectedOrder?.id !== order.id ? (
                  <LoadingSpinner label="Loading order detail..." />
                ) : null}
                {selectedOrder?.id === order.id ? (
                  <>
                    <div className="detail-columns">
                      <div>
                        <h4>Shipping</h4>
                        <p>{selectedOrder.shipping_full_name}</p>
                        <p>{selectedOrder.shipping_line1}</p>
                        {selectedOrder.shipping_line2 ? <p>{selectedOrder.shipping_line2}</p> : null}
                        <p>
                          {selectedOrder.shipping_city}, {selectedOrder.shipping_state}{" "}
                          {selectedOrder.shipping_postal_code}
                        </p>
                        <p>{selectedOrder.shipping_country}</p>
                      </div>
                      <div>
                        <h4>Summary</h4>
                        <p>Subtotal: {formatCurrency(selectedOrder.subtotal)}</p>
                        <p>Shipping: {formatCurrency(selectedOrder.shipping_cost)}</p>
                        <p>Total: {formatCurrency(selectedOrder.total_price)}</p>
                      </div>
                    </div>
                    <div className="order-items-list">
                      {selectedOrder.items.map((item) => (
                        <div className="order-item-row" key={item.id}>
                          <span>
                            {item.product_name} × {item.quantity}
                          </span>
                          <strong>{formatCurrency(item.line_total)}</strong>
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
