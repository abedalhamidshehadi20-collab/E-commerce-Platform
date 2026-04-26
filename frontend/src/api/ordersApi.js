import apiClient from "./apiClient";

const ordersApi = {
  checkout: (payload) => apiClient.post("/orders/checkout", payload),
  createPaymentSession: (payload) => apiClient.post("/orders/payment-sessions", payload),
  confirmPaymentSession: (payload) =>
    apiClient.post("/orders/payment-sessions/confirm", payload),
  getOrders: () => apiClient.get("/orders"),
  getOrderById: (orderId) => apiClient.get(`/orders/${orderId}`),
};

export default ordersApi;
