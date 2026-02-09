// src/api.js
import axios from "axios";

/* =========================
   AXIOS INSTANCE
========================= */
const API = axios.create({
  baseURL: "https://e-canteen-7.onrender.com",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 60000, // Render cold start safe
});

/* =========================
   REQUEST INTERCEPTOR
========================= */
API.interceptors.request.use(
  (config) => {
    // 🚫 DO NOT attach token to auth routes
    if (
      config.url?.includes("/auth/login") ||
      config.url?.includes("/auth/register")
    ) {
      return config;
    }

    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* =========================
   RESPONSE INTERCEPTOR
========================= */
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    // 🔒 Token expired / invalid (NOT login/register)
    if (
      status === 401 &&
      !error.config?.url?.includes("/auth/login") &&
      !error.config?.url?.includes("/auth/register")
    ) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      if (window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
    }

    return Promise.reject(error);
  }
);

/* =========================
   AUTH
========================= */
export const loginUser = (data) =>
  API.post("/auth/login", data);

export const registerUser = (data) =>
  API.post("/auth/register", data);

/* =========================
   MENU
========================= */
export const getMenu = () =>
  API.get("/menu");

export const getAllMenu = () =>
  API.get("/menu/all");

/* =========================
   ORDERS (USER)
========================= */
export const createOrder = (data) =>
  API.post("/orders", data);

export const getUserOrders = () =>
  API.get("/orders");

/* =========================
   ADMIN
========================= */
export const getAdminOrders = () =>
  API.get("/admin/orders");

export const getOnlineOrders = () =>
  API.get("/admin/orders/online");

export const updateOrderStatus = (orderId, status) =>
  API.put(`/admin/orders/${orderId}/status`, { status });

export const toggleMenuAvailability = (itemId) =>
  API.put(`/admin/menu/${itemId}/availability`);

export const placeCounterOrder = (data) =>
  API.post("/admin/place-order", data);

/* =========================
   WALLET
========================= */
export const getMyWallet = () =>
  API.get("/wallet/me");

export const adminAddMoney = (data) =>
  API.post("/wallet/admin/add-money", data);

/* =========================
   FEEDBACK
========================= */
export const submitFeedback = (data) =>
  API.post("/feedback", data);

export const getAllFeedback = () =>
  API.get("/feedback/admin");

/* =========================
   LOGOUT
========================= */
export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  if (window.location.pathname !== "/login") {
    window.location.replace("/login");
  }
};

export default API;
