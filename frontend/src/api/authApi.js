import apiClient from "./apiClient";

const authApi = {
  register: (payload) => apiClient.post("/auth/register", payload),
  login: (payload) => apiClient.post("/auth/login", payload),
  me: () => apiClient.get("/auth/me"),
  updateProfile: (payload) => apiClient.put("/profile", payload),
  getAddresses: () => apiClient.get("/addresses"),
  createAddress: (payload) => apiClient.post("/addresses", payload),
};

export default authApi;
