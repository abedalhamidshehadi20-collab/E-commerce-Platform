import apiClient from "./apiClient";

const contactApi = {
  sendMessage: (payload) => apiClient.post("/contact", payload),
};

export default contactApi;
