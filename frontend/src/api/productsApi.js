import apiClient from "./apiClient";

const productsApi = {
  getProducts: (params = {}) => apiClient.get("/products", { params }),
  getProductById: (productId) => apiClient.get(`/products/${productId}`),
  getCategories: () => apiClient.get("/categories"),
};

export default productsApi;
