import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AdminRoute = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  /* ================= WAIT FOR AUTH RESTORE ================= */
  if (loading) {
    return null;
  }

  /* ================= NOT AUTHENTICATED ================= */
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  /* ================= NOT ADMIN ================= */
  const role = user?.role?.toLowerCase();

  if (role !== "admin") {
    return <Navigate to="/" replace />;
  }

  /* ================= ADMIN ACCESS ================= */
  return children;
};

export default AdminRoute;