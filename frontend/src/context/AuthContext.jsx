import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔒 Prevent double-login in React StrictMode
  const loginOnceRef = useRef(false);

  /* ================= RESTORE AUTH ================= */
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (err) {
      console.error("Auth restore failed:", err);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } finally {
      setLoading(false);
    }
  }, []);

  /* ================= LOGIN ================= */
  const login = (userData, authToken) => {
    if (loginOnceRef.current) return;
    loginOnceRef.current = true;

    // 🔑 backend-compatible storage
    localStorage.setItem("token", authToken);
    localStorage.setItem("user", JSON.stringify(userData));

    setToken(authToken);
    setUser(userData);
  };

  /* ================= WALLET UPDATE ================= */
  const updateWallet = (balance) => {
    setUser((prev) => {
      if (!prev) return prev;

      const updatedUser = {
        ...prev,
        wallet_balance: balance,
      };

      localStorage.setItem("user", JSON.stringify(updatedUser));
      return updatedUser;
    });
  };

  /* ================= LOGOUT ================= */
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    loginOnceRef.current = false;
    setToken(null);
    setUser(null);
  };

  /* ================= ROLE HELPERS ================= */
  const isAdmin = user?.role === "admin";
  const isStaff = user?.role === "staff";

  /* ================= CONTEXT VALUE ================= */
  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        updateWallet,
        isAuthenticated: Boolean(token),
        isAdmin,
        isStaff,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

/* ================= HOOK ================= */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};
