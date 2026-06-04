import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { ShoppingCart, LogOut } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

const Navbar = () => {

  const navigate = useNavigate();
  const location = useLocation();

  const { user, logout, loading, isAuthenticated } = useAuth();
  const { cart } = useCart();

  if (loading) return null;

  const role = (user?.role || "").toLowerCase();

  const isAdmin = role === "admin";
  const isStudent = role === "student";
  const isFaculty = role === "faculty";

  /* admins use their own layout */
  if (isAdmin) return null;

  const cartCount = (cart || []).reduce(
    (sum, item) => sum + (item.quantity || 1),
    0
  );

  const hideAuthButtons =
    location.pathname === "/login" ||
    location.pathname === "/join" ||
    location.pathname.startsWith("/register");

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  const handleLogoClick = () => {

    if (isStudent) {
      navigate("/menu");
      return;
    }

    if (isFaculty) {
      navigate("/faculty/dashboard");
      return;
    }

    navigate("/");
  };

  return (

    <nav className="w-full bg-surface border-b border-border shadow-soft px-6 py-4 flex flex-wrap items-center justify-between gap-3">

      <button
        onClick={handleLogoClick}
        className="text-2xl font-semibold text-primary"
      >
        ☕ E-Canteen
      </button>

      {/* STUDENT LINKS */}

      {isStudent && (
        <div className="flex items-center gap-6 text-sm font-medium">

          <Link to="/menu" className="text-sm font-medium text-text hover:text-primary transition-colors duration-200">
            Menu
          </Link>

          <Link to="/monthly-menu" className="text-sm font-medium text-text hover:text-primary transition-colors duration-200">
            Monthly Menu
          </Link>

          <Link to="/orders" className="text-sm font-medium text-text hover:text-primary transition-colors duration-200">
            My Orders
          </Link>

        </div>
      )}

      {/* FACULTY LINKS */}

      {isFaculty && (
        <div className="flex items-center gap-6 text-sm font-medium">

          <Link
            to="/faculty/dashboard"
            className="hover:text-orange-500"
          >
            Dashboard
          </Link>

          <Link
            to="/faculty/orders"
            className="hover:text-orange-500"
          >
            Orders
          </Link>

        </div>
      )}

      {/* RIGHT SIDE */}

      <div className="flex items-center gap-4">

        {isStudent && (
          <Link to="/cart" className="relative">

            <ShoppingCart className="w-6 h-6 text-gray-700" />

            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {cartCount}
              </span>
            )}

          </Link>
        )}

        {!isAuthenticated && !hideAuthButtons && (
          <>
            <Button
              variant="outline"
              className="border-border text-text hover:border-primary hover:text-primary"
              onClick={() => navigate("/login")}
            >
              Login
            </Button>

            <Button
              variant="default"
              onClick={() => navigate("/join")}
            >
              Register
            </Button>
          </>
        )}

        {isAuthenticated && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        )}

      </div>

    </nav>

  );

};

export default Navbar;