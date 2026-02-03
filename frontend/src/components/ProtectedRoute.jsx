import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  // ⏳ WAIT until auth is restored
  if (loading) return null;

  // ❌ Not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ❌ Role not allowed
  if (
    allowedRoles &&
    !allowedRoles.includes(user.role?.toLowerCase())
  ) {
    return <Navigate to="/" replace />;
  }

  // ✅ Allowed
  return children;
};

export default ProtectedRoute;
