import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { ShoppingCart, LogOut } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { user, logout, loading, isAuthenticated } = useAuth();
  const { cartCount = 0 } = useCart();

  /* ⏳ WAIT FOR AUTH RESTORE */
  if (loading) return null;

  const isAdmin = user?.role === "admin";
  const isCustomer =
    user?.role === "student" || user?.role === "faculty";

  /* 🔒 ADMIN NEVER SEES NAVBAR */
  if (isAdmin) return null;

  /* ❌ HIDE AUTH BUTTONS ON AUTH ROUTES */
  const hideAuthButtons =
    location.pathname === "/login" ||
    location.pathname === "/join" ||
    location.pathname.startsWith("/register");

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  const handleLogoClick = () => {
    if (isCustomer) {
      navigate("/menu");
    } else {
      navigate("/");
    }
  };

  return (
    <nav className="w-full bg-white shadow-md px-6 py-4 flex items-center justify-between">
      {/* LOGO */}
      <button
        onClick={handleLogoClick}
        className="text-2xl font-bold text-orange-600"
      >
        ☕ E-Canteen
      </button>

      {/* CENTER LINKS (ONLY STUDENT / FACULTY) */}
      {isCustomer && (
        <div className="flex items-center gap-6 text-sm font-medium">
          <Link to="/menu" className="hover:text-orange-500">
            Menu
          </Link>

          <Link to="/monthly-menu" className="hover:text-orange-500">
            Monthly Menu
          </Link>

          <Link to="/orders" className="hover:text-orange-500">
            My Orders
          </Link>
        </div>
      )}

      {/* RIGHT ACTIONS */}
      <div className="flex items-center gap-4">
        {/* CART */}
        {isCustomer && (
          <Link to="/cart" className="relative">
            <ShoppingCart className="w-6 h-6 text-gray-700" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {cartCount}
              </span>
            )}
          </Link>
        )}

        {/* LOGIN / REGISTER */}
        {!isAuthenticated && !hideAuthButtons && (
          <>
            <Button
              variant="outline"
              onClick={() => navigate("/login")}
            >
              Login
            </Button>
            <Button
              className="bg-orange-500 hover:bg-orange-600 text-white"
              onClick={() => navigate("/join")}
            >
              Register
            </Button>
          </>
        )}

        {/* LOGOUT */}
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
