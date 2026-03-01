import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AdminRoute = ({ children }) => {
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

  // ❌ Not logged in (check BOTH user + token)
  if (!user || !token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ❌ Not admin (safe lowercase check)
  if (user?.role?.toLowerCase() !== "admin") {
    return <Navigate to="/" replace />;
  }

  // ✅ Admin allowed
  return children;
};

export default AdminRoute;