import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AdminRoute = ({ children }) => {

  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  /* ================= NOT LOGGED IN ================= */

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  /* ================= ROLE CHECK ================= */

  const role = (user?.role || "").toLowerCase();

  if (role !== "admin") {
    return <Navigate to="/" replace />;
  }

  /* ================= ADMIN ACCESS ================= */

  return children;

};

export default AdminRoute;