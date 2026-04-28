import apiClient from "./apiClient";

const couponsApi = {
  getCoupons: () => apiClient.get("/coupons/"),
  applyCoupon: (payload) => apiClient.post("/coupons/apply/", payload),
};

export default couponsApi;
