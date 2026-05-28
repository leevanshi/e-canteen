/* =========================
   API CONFIG
========================= */
const DEV_BASE_URL = "http://localhost:8001";
const PROD_BASE_URL = "https://e-canteen-7.onrender.com";

export const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  process.env.REACT_APP_API_BASE_URL ||
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? DEV_BASE_URL
    : PROD_BASE_URL);


/* =========================
   AUTH
========================= */
export const TOKEN_KEY = "token";
export const USER_KEY = "user";

/* =========================
   CART
========================= */
export const CART_KEY = "cart";

/* =========================
   PAYMENT
========================= */
export const PAYMENT_METHODS = {
  ONLINE: "online",
  CASH: "cash",
};

/* =========================
   ORDER STATUS
========================= */
export const ORDER_STATUS = {
  PLACED: "placed",
  PREPARING: "preparing",
  READY: "ready",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

/* =========================
   PAYMENT STATUS
========================= */
export const PAYMENT_STATUS = {
  PENDING: "pending",
  PAID: "paid",
  CASH: "cash",
};

/* =========================
   PICKUP TIME SLOTS
========================= */
export const PICKUP_TIME_SLOTS = [
  "12:00 - 12:15",
  "12:15 - 12:30",
  "12:30 - 12:45",
  "12:45 - 13:00",
];

/* =========================
   RAZORPAY
========================= */
export const RAZORPAY_THEME_COLOR = "#f97316";
