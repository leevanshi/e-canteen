// src/App.js
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "sonner";

// Public pages
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import JoinPage from "./pages/JoinPage";

// Student pages
import MenuPage from "./pages/MenuPage";
import MonthlyMenu from "./pages/MonthlyMenu";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrdersPage from "./pages/OrdersPage";
import OrderSuccessPage from "./pages/OrderSuccessPage";
import OrderDetails from "./pages/OrderDetails";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";

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

const App = () => {
  const location = useLocation();

  // 🚫 Hide navbar on auth & admin routes
  const hideNavbar =
    location.pathname.startsWith("/admin") ||
    location.pathname === "/login" ||
    location.pathname === "/join" ||
    location.pathname.startsWith("/register");

  return (
    <>
      <Toaster
        position="top-right"
        richColors
        toastOptions={{ style: { zIndex: 9999 } }}
      />

      {!hideNavbar && <Navbar />}

      <Routes>
        {/* 🌍 LANDING */}
        <Route path="/" element={<LandingPage />} />

        {/* 🌍 PUBLIC */}
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

        {/* 👩‍🎓 STUDENT */}
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

        {/* 🔐 ADMIN */}
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

        {/* ❌ FALLBACK */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export default App;
