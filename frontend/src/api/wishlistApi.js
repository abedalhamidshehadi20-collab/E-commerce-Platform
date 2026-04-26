import apiClient from "./apiClient";

const wishlistApi = {
  getWishlist: () => apiClient.get("/wishlist/"),
  addToWishlist: (payload) => apiClient.post("/wishlist/add/", payload),
  removeFromWishlist: (productId) => apiClient.delete(`/wishlist/remove/${productId}/`),
  clearWishlist: () => apiClient.delete("/wishlist/clear/"),
};

export default wishlistApi;
