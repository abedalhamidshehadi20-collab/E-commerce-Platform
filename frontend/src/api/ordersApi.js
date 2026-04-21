import apiClient from "./apiClient";

const ordersApi = {
  checkout: (payload) => apiClient.post("/orders/checkout", payload),
  getOrders: () => apiClient.get("/orders"),
  getOrderById: (orderId) => apiClient.get(`/orders/${orderId}`),
};

export default ordersApi;
