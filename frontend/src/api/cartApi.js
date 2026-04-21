import apiClient from "./apiClient";

const cartApi = {
  getCart: () => apiClient.get("/cart"),
  addToCart: (payload) => apiClient.post("/cart/add", payload),
  updateCart: (payload) => apiClient.patch("/cart/update", payload),
  removeFromCart: (productId) =>
    apiClient.delete("/cart/remove", { data: { product_id: productId } }),
};

export default cartApi;
