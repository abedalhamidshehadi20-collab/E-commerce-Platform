import axios from "axios";

import {
  clearStoredTokens,
  getAccessToken,
  getRefreshToken,
  setStoredTokens,
} from "../utils/storage";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

export const BACKEND_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
}

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      getRefreshToken()
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((refreshError) => Promise.reject(refreshError));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh: getRefreshToken(),
        });
        const nextTokens = {
          access: response.data.access,
          refresh: response.data.refresh || getRefreshToken(),
        };
        setStoredTokens(nextTokens);
        apiClient.defaults.headers.common.Authorization = `Bearer ${nextTokens.access}`;
        processQueue(null, nextTokens.access);
        originalRequest.headers.Authorization = `Bearer ${nextTokens.access}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        clearStoredTokens();
        processQueue(refreshError, null);
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export function getApiErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.detail ||
    error?.response?.data?.errors?.detail?.[0] ||
    error?.message ||
    "Something went wrong."
  );
}

export default apiClient;
