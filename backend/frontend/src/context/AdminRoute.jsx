import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AdminRoute = ({ children }) => {

  const { user, loading, isAuthenticated, isAdmin } = useAuth();

  /* ================= WAIT FOR AUTH RESTORE ================= */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    );
  }

  /* ================= NOT LOGGED IN ================= */

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  /* ================= NOT ADMIN ================= */

  if (!isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  /* ================= ALLOW ACCESS ================= */

  return children ?? null;

};

export default AdminRoute;