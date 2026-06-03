import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {

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
      <Navigate to="/login" state={{ from: location }} replace />
    );
  }

  /* ================= ROLE CHECK ================= */
  if (allowedRoles.length > 0) {
    const userRole = String(user.role || "").toLowerCase();
    const normalizedRoles = allowedRoles.map((role) => String(role).toLowerCase());

    if (!normalizedRoles.includes(userRole)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  /* ================= ACCESS GRANTED ================= */

  return children;

};

export default ProtectedRoute;