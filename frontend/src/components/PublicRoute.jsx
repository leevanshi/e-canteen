import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PublicRoute = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth();

  /* ================= WAIT FOR AUTH RESTORE ================= */
  if (loading) {
    return null;
  }

  /* ================= ALREADY LOGGED IN ================= */
  if (isAuthenticated) {
    const role = user?.role?.toLowerCase();

    if (role === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    }

    if (role === "faculty") {
      return <Navigate to="/" replace />;
    }

    if (role === "student") {
      return <Navigate to="/menu" replace />;
    }

    // fallback if unknown role
    return <Navigate to="/" replace />;
  }

  /* ================= NOT LOGGED IN ================= */
  return children;
};

export default PublicRoute;