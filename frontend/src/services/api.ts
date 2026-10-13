import axios, { AxiosInstance } from "axios";
import config from "../config";

const BASE_URL = config.BASE_URL || "http://localhost:5000";

export const apiClient: AxiosInstance = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// Dynamic request interceptor to always attach current token
apiClient.interceptors.request.use(
  (reqConfig) => {
    const token = localStorage.getItem("authToken") || localStorage.getItem("iap-token");
    if (token && reqConfig.headers) {
      reqConfig.headers.Authorization = `Bearer ${token}`;
    }
    return reqConfig;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle session expiration
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized and not already on login page, redirect
      if (!window.location.pathname.includes("/login")) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("authUser");
        window.location.href = "/login?expired=true";
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
