// components/PublicRoute.jsx

import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PublicRoute = ({ children }) => {
  const { user, token, loading } = useAuth();

  // ⏳ Wait for auth restore
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    );
  }

  // 🔐 Already logged in → redirect by role
  if (user && token) {
    const role = user?.role?.toLowerCase();

    if (role === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    }

    if (role === "faculty") {
      return <Navigate to="/faculty/dashboard" replace />;
    }

    // student (default)
    return <Navigate to="/menu" replace />;
  }

  // ✅ Not logged in → allow public page
  return children;
};

export default PublicRoute;