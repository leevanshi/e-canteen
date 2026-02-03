/* =========================
   API CONFIG
========================= */
export const API_BASE_URL = "http://localhost:8000/api";

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
