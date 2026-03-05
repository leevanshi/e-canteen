
// src/App.js
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { useEffect } from "react";

// Public pages
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import JoinPage from "./pages/JoinPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";

// Student pages
import MenuPage from "./pages/MenuPage";
import MonthlyMenu from "./pages/MonthlyMenu";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrdersPage from "./pages/OrdersPage";
import OrderSuccessPage from "./pages/OrderSuccessPage";
import OrderDetails from "./pages/OrderDetails";

// Admin pages
import AdminMonthlyMenu from "./pages/AdminMonthlyMenu";
import AdminDashboard from "./pages/AdminDashboard";
import AdminOrderPage from "./pages/AdminOrderPage";
import AdminOrderHistory from "./pages/AdminOrderHistory";
import AdminFeedbackPage from "./pages/AdminFeedbackPage";
import AdminWalletPage from "./pages/AdminWalletPage";
import AdminMenuPage from "./pages/AdminMenuPage";
import AdminCounterMenu from "./pages/AdminCounterMenu";

// Components
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";

const BACKEND_URL = "https://e-canteen-7.onrender.com";

const App = () => {
  const location = useLocation();

  // Hide navbar on auth & admin routes
  const hideNavbar =
    location.pathname.startsWith("/admin") ||
    ["/login", "/join"].includes(location.pathname) ||
    location.pathname.startsWith("/register");

  // Wake backend (Render sleeps after inactivity)
  useEffect(() => {
    const wakeBackend = async () => {
      try {
        await fetch(`${BACKEND_URL}/health`);
        console.log("Backend awake");
      } catch {
        console.log("Retrying backend wake...");
        setTimeout(wakeBackend, 5000);
      }
    };

    wakeBackend();
  }, []);

  return (
    <>
      <Toaster
        position="top-right"
        richColors
        toastOptions={{ style: { zIndex: 9999 } }}
      />

      {!hideNavbar && <Navbar />}

      <Routes>
        {/* Landing */}
        <Route path="/" element={<LandingPage />} />

        {/* Public */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />

        <Route
          path="/join"
          element={
            <PublicRoute>
              <JoinPage />
            </PublicRoute>
          }
        />

        <Route
          path="/register/:role"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />

        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Student */}
        <Route
          path="/menu"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <MenuPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/monthly-menu"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <MonthlyMenu />
            </ProtectedRoute>
          }
        />

        <Route
          path="/cart"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <CartPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/checkout"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/orders/success/:orderId"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <OrderSuccessPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/orders"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <OrdersPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/orders/:orderId"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <OrderDetails />
            </ProtectedRoute>
          }
        />

        {/* Admin */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/menu"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminMenuPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/counter"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminCounterMenu />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/wallet"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminWalletPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/monthly-menu"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminMonthlyMenu />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/orders"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminOrderPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/history"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminOrderHistory />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/feedbacks"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminFeedbackPage />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export default App;