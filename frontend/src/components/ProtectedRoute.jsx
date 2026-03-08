import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {

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

  if (allowedRoles.length > 0) {

    const userRole = (user?.role || "").toLowerCase();

    const normalizedRoles = allowedRoles.map(
      (role) => role.toLowerCase()
    );

    if (!normalizedRoles.includes(userRole)) {

      /* redirect user to correct area */

      if (userRole === "admin") {
        return <Navigate to="/admin/dashboard" replace />;
      }

      if (userRole === "faculty") {
        return <Navigate to="/faculty/dashboard" replace />;
      }

      return <Navigate to="/menu" replace />;
    }

  }

  /* ================= ACCESS GRANTED ================= */

  return children;

};

export default ProtectedRoute;