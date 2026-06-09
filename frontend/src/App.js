import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { useEffect } from "react";
import { AnimatePresence } from "framer-motion";

/* PUBLIC */
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import JoinPage from "./pages/JoinPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";

/* STUDENT */
import MenuPage from "./pages/MenuPage";
import MonthlyMenu from "./pages/MonthlyMenu";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrdersPage from "./pages/OrdersPage";
import OrderSuccessPage from "./pages/OrderSuccessPage";
import OrderDetails from "./pages/OrderDetails";

/* ADMIN */
import AdminMonthlyMenu from "./pages/AdminMonthlyMenu";
import AdminDashboard from "./pages/AdminDashboard";
import AdminOrderPage from "./pages/AdminOrderPage";
import AdminOrderHistory from "./pages/AdminOrderHistory";
import AdminFeedbackPage from "./pages/AdminFeedbackPage";
import AdminWalletPage from "./pages/AdminWalletPage";
import AdminMenuPage from "./pages/AdminMenuPage";
import AdminCounterMenu from "./pages/AdminCounterMenu";
import UnauthorizedPage from "./pages/UnauthorizedPage";

/* COMPONENTS */
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import AnimatedPage from "./components/AnimatedPage";
import ErrorBoundary from "./components/ErrorBoundary";

const DEV_BACKEND_URL = "http://localhost:8001";
const PROD_BACKEND_URL = "https://e-canteen-7.onrender.com";
const BACKEND_URL =
  process.env.REACT_APP_API_URL ||
  process.env.REACT_APP_API_BASE_URL ||
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? DEV_BACKEND_URL
    : PROD_BACKEND_URL);

const App = () => {

  const location = useLocation();

  const hideNavbar =
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/login") ||
    location.pathname.startsWith("/register") ||
    location.pathname.startsWith("/join");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  /* WAKE RENDER BACKEND */

  useEffect(() => {
    const wakeBackend = async () => {
      try {
        await fetch(`${BACKEND_URL}/`);
      } catch {
        setTimeout(wakeBackend, 5000);
      }
    };
    wakeBackend();
  }, []);

  return (
    <ErrorBoundary>
      <Toaster position="top-right" richColors />
      {!hideNavbar && <Navbar />}
      
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>

          {/* PUBLIC */}
          <Route path="/" element={<AnimatedPage><LandingPage /></AnimatedPage>} />

          <Route
            path="/login"
            element={
              <PublicRoute>
                <AnimatedPage><LoginPage /></AnimatedPage>
              </PublicRoute>
            }
          />

          <Route
            path="/join"
            element={
              <PublicRoute>
                <AnimatedPage><JoinPage /></AnimatedPage>
              </PublicRoute>
            }
          />

          <Route
            path="/register/:role"
            element={
              <PublicRoute>
                <AnimatedPage><RegisterPage /></AnimatedPage>
              </PublicRoute>
            }
          />

          <Route
            path="/forgot-password"
            element={<AnimatedPage><ForgotPasswordPage /></AnimatedPage>}
          />

          {/* STUDENT */}
          <Route
            path="/menu"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <AnimatedPage><MenuPage /></AnimatedPage>
              </ProtectedRoute>
            }
          />

          <Route
            path="/monthly-menu"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <AnimatedPage><MonthlyMenu /></AnimatedPage>
              </ProtectedRoute>
            }
          />

          <Route
            path="/cart"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <AnimatedPage><CartPage /></AnimatedPage>
              </ProtectedRoute>
            }
          />

          <Route
            path="/checkout"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <AnimatedPage><CheckoutPage /></AnimatedPage>
              </ProtectedRoute>
            }
          />

          <Route
            path="/orders"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <AnimatedPage><OrdersPage /></AnimatedPage>
              </ProtectedRoute>
            }
          />

          <Route
            path="/orders/success/:orderId"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <AnimatedPage><OrderSuccessPage /></AnimatedPage>
              </ProtectedRoute>
            }
          />

          <Route
            path="/orders/:orderId"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <AnimatedPage><OrderDetails /></AnimatedPage>
              </ProtectedRoute>
            }
          />

          {/* ADMIN */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AnimatedPage><AdminDashboard /></AnimatedPage>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/menu"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AnimatedPage><AdminMenuPage /></AnimatedPage>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/counter"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AnimatedPage><AdminCounterMenu /></AnimatedPage>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/wallet"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AnimatedPage><AdminWalletPage /></AnimatedPage>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/monthly-menu"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AnimatedPage><AdminMonthlyMenu /></AnimatedPage>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/orders"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AnimatedPage><AdminOrderPage /></AnimatedPage>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/history"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AnimatedPage><AdminOrderHistory /></AnimatedPage>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/feedbacks"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AnimatedPage><AdminFeedbackPage /></AnimatedPage>
              </ProtectedRoute>
            }
          />

          <Route
            path="/unauthorized"
            element={
              <AnimatedPage><UnauthorizedPage /></AnimatedPage>
            }
          />

          {/* FALLBACK */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </AnimatePresence>
    </ErrorBoundary>
  );
};

export default App;