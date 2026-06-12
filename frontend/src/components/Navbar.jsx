import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { ShoppingCart, LogOut, Moon, Sun, Menu, X, Wallet } from "lucide-react";
import { useState, useEffect } from "react";

import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";
import API from "../api";

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

  const handleLogout = () => {
    logout();
    // Small delay to ensure state updates before navigation
    setTimeout(() => {
      navigate("/", { replace: true });
      setMobileMenuOpen(false);
    }, 100);
  };

  const handleLogoClick = () => {
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
  };

  const handleMobileNav = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 md:px-6 py-4 flex items-center justify-between sticky top-0 z-50">

        <button
          onClick={handleLogoClick}
          className="text-2xl font-bold text-orange-600 dark:text-orange-400"
        >
          ☕ E-Canteen
        </button>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">

          {isStudent && (
            <>
              <Link to="/menu" className="text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 font-medium transition-colors">
                Menu
              </Link>

              <Link to="/monthly-menu" className="text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 font-medium transition-colors">
                Monthly Menu
              </Link>

              <Link to="/orders" className="text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 font-medium transition-colors">
                My Orders
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

          <div className="flex items-center gap-3">
            {/* Wallet Balance */}
            {isAuthenticated && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full border-2" style={{ backgroundColor: darkMode ? '#1e293b' : '#f8fafc', borderColor: darkMode ? '#FF8A3D' : '#e2e8f0' }}>
                <Wallet className="w-4 h-4" style={{ color: '#FF8A3D' }} />
                <span className="font-semibold text-gray-900 dark:text-white">
                  {loadingWallet ? 'Loading...' : `₹${walletBalance}`}
                </span>
              </div>
            )}

            <button
              onClick={toggleDarkMode}
              className="relative w-11 h-11 flex items-center justify-center rounded-xl border-2 transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 hover:scale-105"
              style={{
                backgroundColor: darkMode ? '#1f2937' : '#f3f4f6',
                borderColor: darkMode ? '#FF8A3D' : '#d1d5db',
                boxShadow: darkMode ? '0 0 15px rgba(255, 138, 61, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.1)'
              }}
              title="Switch Theme"
              aria-label="Switch Theme"
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-white" />
              ) : (
                <Moon className="w-5 h-5 text-gray-700" />
              )}
            </button>

            {isStudent && (
              <Link to="/cart" className="relative">
                <ShoppingCart className="w-6 h-6 text-gray-700 dark:text-gray-300" />
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

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 bg-white dark:bg-gray-900 z-40 p-6 overflow-y-auto">
          <div className="flex flex-col gap-4">
            {isStudent && (
              <>
                <button
                  onClick={() => handleMobileNav("/menu")}
                  className="text-left text-lg font-medium text-gray-700 dark:text-gray-300 py-3 border-b border-gray-200 dark:border-gray-800"
                >
                  Menu
                </button>

                <button
                  onClick={() => handleMobileNav("/monthly-menu")}
                  className="text-left text-lg font-medium text-gray-700 dark:text-gray-300 py-3 border-b border-gray-200 dark:border-gray-800"
                >
                  Monthly Menu
                </button>

                <button
                  onClick={() => handleMobileNav("/orders")}
                  className="text-left text-lg font-medium text-gray-700 dark:text-gray-300 py-3 border-b border-gray-200 dark:border-gray-800"
                >
                  My Orders
                </button>

                <button
                  onClick={() => handleMobileNav("/cart")}
                  className="text-left text-lg font-medium text-gray-700 dark:text-gray-300 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3"
                >
                  <ShoppingCart size={20} />
                  Cart {cartCount > 0 && `(${cartCount})`}
                </button>
              </>
            )}

            {isFaculty && (
              <>
                <button
                  onClick={() => handleMobileNav("/faculty/dashboard")}
                  className="text-left text-lg font-medium text-gray-700 dark:text-gray-300 py-3 border-b border-gray-200 dark:border-gray-800"
                >
                  Dashboard
                </button>

                <button
                  onClick={() => handleMobileNav("/faculty/orders")}
                  className="text-left text-lg font-medium text-gray-700 dark:text-gray-300 py-3 border-b border-gray-200 dark:border-gray-800"
                >
                  Orders
                </button>
              </>
            )}

            <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
              {/* Wallet Balance */}
              {isAuthenticated && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-full border-2 mb-3" style={{ backgroundColor: darkMode ? '#1e293b' : '#f8fafc', borderColor: darkMode ? '#FF8A3D' : '#e2e8f0' }}>
                  <Wallet className="w-4 h-4" style={{ color: '#FF8A3D' }} />
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {loadingWallet ? 'Loading...' : `₹${walletBalance}`}
                  </span>
                </div>
              )}

              <button
                onClick={toggleDarkMode}
                className="w-full flex items-center justify-center gap-3 p-3 rounded-xl border-2 transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 hover:scale-105"
                style={{
                  backgroundColor: darkMode ? '#1f2937' : '#f3f4f6',
                  borderColor: darkMode ? '#FF8A3D' : '#d1d5db',
                  boxShadow: darkMode ? '0 0 15px rgba(255, 138, 61, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}
                title="Switch Theme"
                aria-label="Switch Theme"
              >
                {darkMode ? (
                  <Sun className="w-5 h-5 text-white" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-700" />
                )}
                <span className="font-medium" style={{ color: darkMode ? '#ffffff' : '#374151' }}>
                  {darkMode ? "Light Mode" : "Dark Mode"}
                </span>
              </button>

              {!isAuthenticated && !hideAuthButtons && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleMobileNav("/login")}
                    className="w-full mb-3"
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
      )}
    </>
  );

};

export default Navbar;