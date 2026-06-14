import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { ShoppingCart, LogOut, Moon, Sun, Menu, X, Wallet, User } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";
import API from "../api";
import MobileWalletChip from "./MobileWalletChip.jsx";

const Navbar = () => {

  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loadingWallet, setLoadingWallet] = useState(true);

  const { user, logout, loading, isAuthenticated } = useAuth();
  const { cart } = useCart();
  const { darkMode, toggleDarkMode } = useTheme();

  // Fetch wallet balance
  useEffect(() => {
    const fetchWalletBalance = async () => {
      if (!isAuthenticated) {
        setWalletBalance(0);
        setLoadingWallet(false);
        return;
      }

      try {
        setLoadingWallet(true);
        console.log("Fetching wallet balance...");
        const res = await API.get("/wallet/me");
        console.log("Wallet response:", res.data);
        const balance = res?.data?.balance || res?.data?.wallet_balance || 0;
        console.log("Wallet balance:", balance);
        setWalletBalance(balance);
      } catch (error) {
        console.error("Failed to fetch wallet balance:", error);
        setWalletBalance(0);
      } finally {
        setLoadingWallet(false);
      }
    };

    fetchWalletBalance();
  }, [isAuthenticated]);

  // Debug: Log wallet state
  useEffect(() => {
    console.log("Navbar wallet state:", { walletBalance, loadingWallet, isAuthenticated });
  }, [walletBalance, loadingWallet, isAuthenticated]);

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

  const handleLogoClick = useCallback(() => {
    setMobileMenuOpen(false);
    if (isStudent) {
      navigate("/menu");
      return;
    }

    if (isFaculty) {
      navigate("/faculty/dashboard");
      return;
    }

    navigate("/");
  }, [navigate, isStudent, isFaculty]);

  const handleMobileNav = useCallback((path) => {
    navigate(path);
    setMobileMenuOpen(false);
  }, [navigate]);

  const handleLogout = useCallback(() => {
    logout();
    setTimeout(() => {
      navigate("/", { replace: true });
      setMobileMenuOpen(false);
    }, 100);
  }, [logout, navigate]);

  return (
    <>
      <nav className="w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 md:px-6 py-3 lg:py-4 flex items-center justify-between sticky top-0 z-50 overflow-hidden">

        {/* LEFT: Hamburger (Mobile) / Logo (Desktop) */}
        <div className="flex items-center gap-3">
          {/* Hamburger Menu - Mobile Only */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500"
            aria-label="Open Menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={24} className="text-gray-700 dark:text-gray-300" /> : <Menu size={24} className="text-gray-700 dark:text-gray-300" />}
          </button>

          {/* Logo */}
          <button
            onClick={handleLogoClick}
            className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-600 dark:text-orange-400 whitespace-nowrap"
          >
            ☕ E-Canteen
          </button>
        </div>

        {/* CENTER: Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-6">
          {isStudent && (
            <>
              <Link to="/menu" className="text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 font-medium transition-colors">
                Menu
              </Link>
              <Link to="/monthly-menu" className="text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 font-medium transition-colors">
                Monthly Menu 📄
              </Link>
              <Link to="/orders" className="text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 font-medium transition-colors">
                My Orders
              </Link>
              <Link to="/profile" className="text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 font-medium transition-colors">
                My Profile
              </Link>
            </>
          )}

          {isFaculty && (
            <>
              <Link to="/faculty/dashboard" className="text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 font-medium transition-colors">
                Dashboard
              </Link>
              <Link to="/faculty/orders" className="text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 font-medium transition-colors">
                Orders
              </Link>
            </>
          )}
        </div>

        {/* RIGHT: Wallet, Cart, Theme, Auth */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Wallet Balance - Always Visible */}
          {isAuthenticated && (
            <MobileWalletChip
              balance={walletBalance}
              loading={loadingWallet}
            />
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleDarkMode}
            className="relative w-9 h-9 md:w-11 md:h-11 flex items-center justify-center rounded-xl border-2 transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 hover:scale-105 flex-shrink-0"
            style={{
              backgroundColor: darkMode ? '#1f2937' : '#f3f4f6',
              borderColor: darkMode ? '#FF8A3D' : '#d1d5db',
              boxShadow: darkMode ? '0 0 15px rgba(255, 138, 61, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.1)'
            }}
            title="Switch Theme"
            aria-label="Switch Theme"
          >
            {darkMode ? (
              <Sun className="w-4 h-4 md:w-5 md:h-5 text-white" />
            ) : (
              <Moon className="w-4 h-4 md:w-5 md:h-5 text-gray-700" />
            )}
          </button>

          {/* Cart - Always Visible for Students */}
          {isStudent && (
            <Link
              to="/cart"
              className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 flex-shrink-0"
              aria-label={`Cart with ${cartCount} items`}
            >
              <ShoppingCart className="w-5 h-5 md:w-6 md:h-6 text-gray-700 dark:text-gray-300" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          )}

          {/* Desktop Auth Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            {!isAuthenticated && !hideAuthButtons && (
              <>
                <Button
                  variant="outline"
                  onClick={() => navigate("/login")}
                  className="border-gray-300 dark:border-gray-700"
                >
                  Login
                </Button>
                <Button
                  onClick={() => navigate("/join")}
                  className="bg-orange-500 hover:bg-orange-600"
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
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Slide-out Drawer */}
          <div className="fixed top-0 right-0 h-full w-72 max-w-[80vw] bg-white dark:bg-gray-900 shadow-2xl z-50 lg:hidden transform transition-transform duration-300 ease-in-out overflow-y-auto">
            <div className="p-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Menu</h2>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500"
                  aria-label="Close Menu"
                >
                  <X size={24} className="text-gray-700 dark:text-gray-300" />
                </button>
              </div>

              {/* Navigation Links */}
              <div className="flex flex-col gap-2">
                {isStudent && (
                  <>
                    <button
                      onClick={() => handleMobileNav("/menu")}
                      className="text-left px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      Menu
                    </button>

                    <button
                      onClick={() => handleMobileNav("/monthly-menu")}
                      className="text-left px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      Monthly Menu 📄
                    </button>

                    <button
                      onClick={() => handleMobileNav("/orders")}
                      className="text-left px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      My Orders
                    </button>
                  </>
                )}

                {isFaculty && (
                  <>
                    <button
                      onClick={() => handleMobileNav("/faculty/dashboard")}
                      className="text-left px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      Dashboard
                    </button>

                    <button
                      onClick={() => handleMobileNav("/faculty/orders")}
                      className="text-left px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      Orders
                    </button>
                  </>
                )}

                {/* Profile Link */}
                {isAuthenticated && (
                  <button
                    onClick={() => handleMobileNav("/profile")}
                    className="text-left px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 flex items-center gap-3"
                  >
                    <User size={20} />
                    Profile
                  </button>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200 dark:border-gray-800 my-6" />

              {/* Auth Actions */}
              <div className="flex flex-col gap-3">
                {!isAuthenticated && !hideAuthButtons && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => handleMobileNav("/login")}
                      className="w-full"
                    >
                      Login
                    </Button>

                    <Button
                      onClick={() => handleMobileNav("/join")}
                      className="w-full bg-orange-500 hover:bg-orange-600"
                    >
                      Register
                    </Button>
                  </>
                )}

                {isAuthenticated && (
                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </Button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );

};

export default Navbar;