import apiClient from "./apiClient";

const authApi = {
  register: (payload) => apiClient.post("/auth/register", payload),
  login: (payload) => apiClient.post("/auth/login", payload),
  forgotPassword: (payload) => apiClient.post("/auth/password/forgot", payload),
  resetPassword: (payload) => apiClient.post("/auth/password/reset", payload),
  me: () => apiClient.get("/auth/me"),
  updateProfile: (payload) => apiClient.put("/profile", payload),
  getAddresses: () => apiClient.get("/addresses"),
  createAddress: (payload) => apiClient.post("/addresses", payload),
};

export default authApi;
