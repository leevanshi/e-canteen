import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AdminRoute = ({ children }) => {

  const { user, loading } = useAuth();
  const location = useLocation();

  /* ================= WAIT FOR AUTH ================= */

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        Loading...
      </div>
    );
  }

  /* ================= NOT LOGGED IN ================= */

  if (!user) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  /* ================= ROLE CHECK ================= */

  const role = String(user.role || "").toLowerCase();

  if (role !== "admin") {
    return <Navigate to="/menu" replace />;
  }

  /* ================= ADMIN ACCESS ================= */

  return children;
};

export default AdminRoute;