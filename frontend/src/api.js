import axios from "axios";

/* =========================
   BASE CONFIG
========================= */
const BASE_URL =
  import.meta.env.VITE_API_URL || "https://e-canteen-7.onrender.com";

const API = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 45000, // Render cold start safety
});

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

const isAuthRoute = (url = "") => {
  if (!url) return false;
  return url.includes("/auth/");
};

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

    /* ===== TOKEN EXPIRED ===== */
    if (status === 401 && !isAuthRoute(url)) {
      clearAuth();

      if (!window.location.pathname.includes("/login")) {
        console.warn("Session expired → redirecting to login");
        window.location.href = "/login";
      }
    }

    /* ===== NETWORK ERROR ===== */
    if (!error.response) {
      console.error("Network error or backend unavailable.");
    }

    return Promise.reject(error);
  }
);

/* =========================
   AUTH
========================= */
export const loginUser = (data) => API.post("/auth/login", data);

export const registerUser = (data) => API.post("/auth/register", data);

/* =========================
   MENU
========================= */
export const getMenu = () => API.get("/menu");

export const getAllMenu = () => API.get("/menu/all");

/* =========================
   ORDERS (USER)
========================= */
export const createOrder = (data) => API.post("/orders", data);

export const getUserOrders = () => API.get("/orders");

/* =========================
   ADMIN
========================= */
export const getAdminOrders = () => API.get("/admin/orders");

export const getOnlineOrders = () => API.get("/admin/orders/online");

export const updateOrderStatus = (orderId, status) =>
  API.put(`/admin/orders/${orderId}/status`, { status });

export const toggleMenuAvailability = (itemId) =>
  API.put(`/admin/menu/${itemId}/availability`);

export const placeCounterOrder = (data) =>
  API.post("/admin/place-order", data);

/* =========================
   WALLET
========================= */
export const getMyWallet = () => API.get("/wallet/me");

export const adminAddMoney = (data) =>
  API.post("/wallet/admin/add-money", data);

/* =========================
   FEEDBACK
========================= */
export const submitFeedback = (data) => API.post("/feedback", data);

export const getAllFeedback = () => API.get("/feedback/admin");

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