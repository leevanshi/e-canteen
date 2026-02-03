// src/api.js
import axios from "axios";

/* =========================
   AXIOS INSTANCE
========================= */
const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

/* =========================
   PUBLIC ROUTES (NO AUTH)
========================= */
const PUBLIC_ROUTES = [
  "/menu",
  "/auth/login",
  "/auth/register",
];

/* =========================
   REQUEST INTERCEPTOR
========================= */
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    const url = config.url || "";

    const isPublic = PUBLIC_ROUTES.some((route) =>
      url.startsWith(route)
    );

    // attach token ONLY to protected routes
    if (token && !isPublic) {
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
    const url = error?.config?.url || "";

    const isPublic = PUBLIC_ROUTES.some((route) =>
      url.startsWith(route)
    );

    if (status === 401 && !isPublic) {
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
export const registerUser = (data) =>
  API.post("/auth/register", data);

export const loginUser = (data) =>
  API.post("/auth/login", data);

/* =========================
   MENU
========================= */
export const getMenu = () =>
  API.get("/menu");

export const getAdminMenu = () =>
  API.get("/admin/menu");

export const toggleMenuAvailability = (itemId) =>
  API.put(`/admin/menu/${itemId}/availability`);

/* =========================
   ORDERS (USER)
========================= */
export const createOrder = (data) =>
  API.post("/orders", data);

export const getUserOrders = () =>
  API.get("/orders");

/* =========================
   ADMIN ORDERS
========================= */
export const getAdminOrders = () =>
  API.get("/admin/orders");

export const updateOrderStatus = (orderId, status) =>
  API.put(`/admin/orders/${orderId}/status`, { status });

/* =========================
   ADMIN COUNTER / WALK-IN
========================= */
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
  window.location.replace("/login");
};

/* =========================
   EXPORT INSTANCE
========================= */
export default API;
