import { createContext, useContext, useEffect, useState, useMemo } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ================= CLEAR AUTH ================= */

  const clearAuth = () => {

    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("cart");
    } catch (err) {
      console.error("Auth clear failed:", err);
    }

    setToken(null);
    setUser(null);

  };

  /* ================= NORMALIZE USER ================= */

  const normalizeUser = (rawUser) => {

    if (!rawUser || typeof rawUser !== "object") return null;

    const role = (rawUser.role || "").toLowerCase();

    return {
      id: rawUser.id || rawUser._id || null,
      name: rawUser.name || rawUser.username || "",
      email: rawUser.email || "",
      role
    };

  };

  /* ================= RESTORE AUTH ================= */

  useEffect(() => {

    try {

      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (storedToken && storedUser) {

        const parsedUser = JSON.parse(storedUser);
        const normalizedUser = normalizeUser(parsedUser);

        if (normalizedUser) {
          setToken(storedToken);
          setUser(normalizedUser);
        } else {
          clearAuth();
        }

      }

    } catch (err) {

      console.error("Auth restore failed:", err);
      clearAuth();

    } finally {

      setLoading(false);

    }

  }, []);

  /* ================= LOGIN ================= */

  const login = (userData, authToken) => {

    const normalizedUser = normalizeUser(userData);

    if (!normalizedUser || !authToken) {
      throw new Error("Invalid login response");
    }

    try {

      localStorage.setItem("token", authToken);
      localStorage.setItem("user", JSON.stringify(normalizedUser));

    } catch (err) {

      console.error("Storage write failed:", err);

    }

    setToken(authToken);
    setUser(normalizedUser);

  };

  /* ================= LOGOUT ================= */

  const logout = () => {

    clearAuth();

  };

  /* ================= TAB SYNC ================= */

  useEffect(() => {

    const handleStorage = () => {

      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (!storedToken || !storedUser) {
        clearAuth();
        return;
      }

      try {

        const parsedUser = JSON.parse(storedUser);
        const normalizedUser = normalizeUser(parsedUser);

        if (normalizedUser) {
          setUser(normalizedUser);
          setToken(storedToken);
        }

      } catch {

        clearAuth();

      }

    };

    window.addEventListener("storage", handleStorage);

    return () => window.removeEventListener("storage", handleStorage);

  }, []);

  /* ================= ROLE HELPERS ================= */

  const isAuthenticated = Boolean(token && user);

  const isAdmin = user?.role === "admin";
  const isStudent = user?.role === "student";
  const isFaculty = user?.role === "faculty";

  /* ================= CONTEXT VALUE ================= */

  const value = useMemo(() => ({
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated,
    isAdmin,
    isStudent,
    isFaculty
  }), [user, token, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
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