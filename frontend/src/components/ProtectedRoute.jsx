import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, token, loading } = useAuth();
  const location = useLocation();

  // ⏳ Wait for auth restore (prevents flicker issue)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    );
  }

  // ❌ Not logged in → redirect to login + remember page
  if (!user || !token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ❌ Role not allowed
  if (allowedRoles.length > 0) {
    const userRole = user?.role?.toLowerCase();

    if (!userRole || !allowedRoles.includes(userRole)) {
      return <Navigate to="/" replace />; // safer than /unauthorized (in case route doesn't exist)
    }
  }

  // ✅ Access granted
  return children;
};

export default ProtectedRoute;