import axios from "axios";

/* =========================
   BASE CONFIG
========================= */

const DEV_FALLBACK_URL = "http://localhost:8001";
const PROD_FALLBACK_URL = "https://e-canteen-7.onrender.com";
const isLocalhost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
const BASE_URL =
  process.env.REACT_APP_API_URL ||
  process.env.REACT_APP_API_BASE_URL ||
  (isLocalhost ? DEV_FALLBACK_URL : PROD_FALLBACK_URL);

const API = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 45000,
});

console.debug("[API] baseURL:", BASE_URL);

/* =========================
   HELPERS
========================= */

const getToken = () => {
  try {
    return localStorage.getItem("token") || null;
  } catch {
    return null;
  }
};

const clearAuth = () => {
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  } catch {}
};

const isAuthRoute = (url = "") =>
  typeof url === "string" && url.includes("/auth/");

/* =========================
   REQUEST INTERCEPTOR
========================= */

API.interceptors.request.use(
  (config) => {
    const token = getToken();

    if (!isAuthRoute(config?.url) && token) {
      config.headers = config.headers || {};
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

    if (status === 401 && !isAuthRoute(url)) {
      clearAuth();

      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }

    if (!error.response) {
      console.error("Backend unreachable or network error.");
    }

    return Promise.reject(error);
  }
);

/* =========================
   AUTH
========================= */

export const sendOTP = (email) =>
  API.post("/auth/send-otp", { email });

export const sendResetOTP = (email) =>
  API.post("/auth/send-reset-otp", { email });

export const verifyOTP = (data) =>
  API.post("/auth/verify-otp", data);

export const registerUser = (data) =>
  API.post("/auth/register", data);

export const loginUser = (data) =>
  API.post("/auth/login", data);

export const resetPassword = (data) =>
  API.post("/auth/reset-password", data);

/* =========================
   MENU
========================= */

export const getMenu = () =>
  API.get("/menu");
export const toggleMenuAvailability = (itemId) =>
  API.patch(`/menu/${itemId}/toggle`, {});
/* =========================
   USER ORDERS
========================= */

export const createOrder = (data) =>
  API.post("/api/orders", data);

export const getUserOrders = () =>
  API.get("/api/orders");

export const getOrderById = (orderId) =>
  API.get(`/api/orders/${orderId}`);

/* =========================
   ADMIN DASHBOARD
========================= */

export const getAdminDashboard = () =>
  API.get("/api/orders/admin/dashboard");

/* =========================
   ADMIN ORDERS
========================= */

export const getAdminOrders = () =>
  API.get("/admin/orders");

export const updateOrderStatus = (orderId, data) =>
  API.put(`/admin/orders/${orderId}/status`, data);

export const placeCounterOrder = (data) =>
  API.post("/admin/place-order", data);

/* =========================
   USERS
========================= */

export const getUsers = () =>
  API.get("/admin/users");

export const deleteUser = (userId) =>
  API.delete(`/admin/users/${userId}`);

/* =========================
   WALLET
========================= */

export const getMyWallet = () =>
  API.get("/wallet/me");

export const adminAddMoney = (data) =>
  API.post("/wallet/admin/add-money", data);

export const getWalletHistory = () =>
  API.get("/wallet/admin/wallet-history");

export const getWalletAnalytics = () =>
  API.get("/wallet/admin/analytics");

/* =========================
   FEEDBACK
========================= */

export const submitFeedback = (data) =>
  API.post("/feedback", data);

export const getAllFeedback = () =>
  API.get("/feedback/admin");

export const getAnalytics = () =>
  API.get("/admin/analytics");

export const getInventory = () =>
  API.get("/inventory");

export const createInventoryItem = (data) =>
  API.post("/inventory", data);

export const updateInventoryItem = (itemId, data) =>
  API.put(`/inventory/${itemId}`, data);

/* =========================
   MONTHLY MENU
========================= */

export const getMonthlyMenu = () =>
  API.get("/api/monthly-menu");

export const uploadMonthlyMenu = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return API.post("/api/monthly-menu/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const deleteMonthlyMenu = () =>
  API.delete("/api/monthly-menu");

export const deleteInventoryItem = (itemId) =>
  API.delete(`/inventory/${itemId}`);

export const getInventoryAlerts = () =>
  API.get("/inventory/alerts");

export const getReport = (reportType) =>
  API.get(`/admin/reports/${reportType}`);

/* =========================
   LOGOUT
========================= */

export const logout = () => {
  clearAuth();

  if (!window.location.pathname.includes("/login")) {
    window.location.href = "/login";
  }
};

export default API;