import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PublicRoute = ({ children }) => {
  const { user, token, loading } = useAuth();

  // ⏳ Show loader instead of blank screen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    );
  }

  // 🔐 Already logged in (must have BOTH user + token)
  if (user && token) {
    const role = user?.role?.toLowerCase();

    if (role === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    }

    return <Navigate to="/menu" replace />;
  }

  // ✅ Not logged in
  return children;
};

export default PublicRoute;