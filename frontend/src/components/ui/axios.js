import axios from "axios";

const DEV_BASE_URL = "http://localhost:8001";
const PROD_BASE_URL = "https://e-canteen-7.onrender.com";
const BASE_URL =
  process.env.REACT_APP_API_URL ||
  process.env.REACT_APP_API_BASE_URL ||
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? DEV_BASE_URL
    : PROD_BASE_URL);

const API = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
  },
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
