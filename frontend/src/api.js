// src/api.js
import axios from "axios";

/* =========================
   BASE CONFIG
========================= */
const BASE_URL = "https://e-canteen-7.onrender.com";

const API = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 60000, // render cold start safe
});

/* =========================
   HELPERS
========================= */
const getToken = () => localStorage.getItem("token");

const isAuthRoute = (url = "") =>
  url.includes("/auth/login") || url.includes("/auth/register");

/* =========================
   REQUEST INTERCEPTOR
========================= */
API.interceptors.request.use(
  (config) => {
    try {
      if (!isAuthRoute(config.url)) {
        const token = getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (err) {
      console.error("Request interceptor error:", err);
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
    const url = error?.config?.url || "";

    // 🔒 Handle unauthorized globally
    if (status === 401 && !isAuthRoute(url)) {
      try {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        if (!window.location.pathname.includes("/login")) {
          window.location.replace("/login");
        }
      } catch (err) {
        console.error("Logout redirect failed:", err);
      }
    }

    // 🌐 Network / timeout error
    if (!error.response) {
      console.error("Network error / server down");
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
   LOGOUT (SAFE GLOBAL)
========================= */
export const logout = () => {
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    if (!window.location.pathname.includes("/login")) {
      window.location.replace("/login");
    }
  } catch (err) {
    console.error("Logout failed:", err);
  }
};

export default API;