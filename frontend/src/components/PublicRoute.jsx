import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // ⏳ WAIT
  if (loading) return null;

  // 🔐 Already logged in
  if (user) {
    const role = user.role?.toLowerCase();
    return (
      <Navigate
        to={role === "admin" ? "/admin/dashboard" : "/menu"}
        replace
      />
    );
  }

  return children;
};

export default PublicRoute;
