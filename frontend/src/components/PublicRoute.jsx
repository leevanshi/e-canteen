import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PublicRoute = ({ children }) => {
  const { user, token, loading } = useAuth();
  const location = useLocation();

  // ⏳ Wait for auth restore
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    );
  }

  // 🔐 Already logged in → redirect safely
  if (user && token) {
    const role = user?.role?.toLowerCase();

    if (role === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    }

    if (role === "faculty") {
      // ⚠️ fallback if route not built yet
      return <Navigate to="/" replace />;
    }

    // default → student
    return <Navigate to="/menu" replace />;
  }

  // ✅ Not logged in → allow access
  return children;
};

export default PublicRoute;