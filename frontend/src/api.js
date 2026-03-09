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
  timeout: 45000
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

const isAuthRoute = (url = "") => url.includes("/auth/");

/* =========================
   REQUEST INTERCEPTOR
========================= */

API.interceptors.request.use(
  (config) => {

    if (!isAuthRoute(config.url)) {
      const token = getToken();

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
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
        console.warn("Session expired → redirecting to login");
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

export const loginUser = (data) =>
  API.post("/auth/login", data);

export const registerUser = (data) =>
  API.post("/auth/register", data);

/* =========================
   MENU
========================= */

export const getMenu = () =>
  API.get("/menu");

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
  API.get("/api/admin/orders");

export const getOnlineOrders = () =>
  API.get("/api/admin/orders/online");

export const updateOrderStatus = (orderId, status) =>
  API.put(`/api/admin/orders/${orderId}/status`, { status });

export const toggleMenuAvailability = (menuId, available) =>
  API.put(`/api/admin/menu/${menuId}/availability`, {
    available,
  });

export const placeCounterOrder = (data) =>
  API.post("/api/admin/place-order", data);

export const getUsers = () =>
  API.get("/api/admin/users");

/* =========================
   WALLET
========================= */

export const getMyWallet = () =>
  API.get("/wallet/me");

export const adminAddMoney = (data) =>
  API.post("/api/admin/add-money", data);

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

  clearAuth();

  if (!window.location.pathname.includes("/login")) {
    window.location.href = "/login";
  }

};

export default API;