// src/api.js
import axios from "axios";

/* =========================
   AXIOS INSTANCE
========================= */
const API = axios.create({
  baseURL:
    process.env.REACT_APP_API_BASE_URL ||
    "https://e-canteen-7.onrender.com",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 60000,
});

// ✅ LOG AFTER INITIALIZATION (SAFE)
console.log("API BASE URL 👉", API.defaults.baseURL);

/* =========================
   REQUEST INTERCEPTOR
========================= */
API.interceptors.request.use(
  (config) => {
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
    if (error?.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.replace("/login");
    }
    return Promise.reject(error);
  }
);

/* =========================
   AUTH
========================= */
export const loginUser = (data) =>
  API.post("/api/auth/login", data);

export const registerUser = (data) =>
  API.post("/api/auth/register", data);


/* =========================
   MENU
========================= */
// GET /api/menu
export const getMenu = () =>
  API.get("/api/menu");

// GET /api/menu/all
export const getAllMenu = () =>
  API.get("/api/menu/all");

/* =========================
   ORDERS (USER)
========================= */
// POST /api/orders
export const createOrder = (data) =>
  API.post("/api/orders", data);

// GET /api/orders
export const getUserOrders = () =>
  API.get("/api/orders");

/* =========================
   ADMIN
========================= */
// GET /api/admin/orders
export const getAdminOrders = () =>
  API.get("/api/admin/orders");

// GET /api/admin/orders/online
export const getOnlineOrders = () =>
  API.get("/api/admin/orders/online");

// PUT /api/admin/orders/{order_id}/status
export const updateOrderStatus = (orderId, status) =>
  API.put(`/api/admin/orders/${orderId}/status`, { status });

// PUT /api/admin/menu/{menu_id}/availability
export const toggleMenuAvailability = (itemId) =>
  API.put(`/api/admin/menu/${itemId}/availability`);

// POST /api/admin/place-order
export const placeCounterOrder = (data) =>
  API.post("/api/admin/place-order", data);

/* =========================
   WALLET
========================= */
// GET /api/wallet/me
export const getMyWallet = () =>
  API.get("/api/wallet/me");

// POST /api/wallet/admin/add-money
export const adminAddMoney = (data) =>
  API.post("/api/wallet/admin/add-money", data);

/* =========================
   FEEDBACK
========================= */
// POST /api/feedback
export const submitFeedback = (data) =>
  API.post("/api/feedback", data);

// GET /api/feedback/admin
export const getAllFeedback = () =>
  API.get("/api/feedback/admin");

/* =========================
   LOGOUT
========================= */
export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.replace("/login");
};

export default API;
