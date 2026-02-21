import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, token, loading } = useAuth();

  // ⏳ Wait for auth restore
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    );
  }

  // ❌ Not logged in OR token missing
  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }

  // ❌ Role not allowed
  if (allowedRoles) {
    const userRole = user?.role?.toLowerCase();

    if (!userRole || !allowedRoles.includes(userRole)) {
      return <Navigate to="/login" replace />;
      // OR: <Navigate to="/unauthorized" replace />
    }
  }

  // ✅ Access granted
  return children;
};

export default ProtectedRoute;