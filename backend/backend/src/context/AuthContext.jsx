import { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";

const AuthContext = createContext(null);

/* ================= USER NORMALIZER ================= */

const normalizeUser = (rawUser) => {

  if (!rawUser || typeof rawUser !== "object") return null;

  const role = String(rawUser.role || "").toLowerCase();

  return {
    id: rawUser.id || rawUser._id || null,
    name: rawUser.name || rawUser.username || "",
    email: rawUser.email || "",
    role
  };

};

export const AuthProvider = ({ children }) => {

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ================= CLEAR AUTH ================= */

  const clearAuth = useCallback(() => {

    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("cart");
    } catch (err) {
      console.error("Auth clear failed:", err);
    }

    setToken(null);
    setUser(null);

  }, []);

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

  }, [clearAuth]);

  /* ================= LOGIN ================= */

  const login = useCallback((userData, authToken) => {

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

  }, []);

  /* ================= LOGOUT ================= */

  const logout = useCallback(() => {
    clearAuth();
  }, [clearAuth]);

  /* ================= TAB SYNC ================= */

  useEffect(() => {

    const handleStorage = () => {

      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (!storedToken || !storedUser) {
        setToken(null);
        setUser(null);
        return;
      }

      try {

        const parsedUser = JSON.parse(storedUser);
        const normalizedUser = normalizeUser(parsedUser);

        if (normalizedUser) {
          setToken(storedToken);
          setUser(normalizedUser);
        }

      } catch {

        clearAuth();

      }

    };

    window.addEventListener("storage", handleStorage);

    return () => window.removeEventListener("storage", handleStorage);

  }, [clearAuth]);

  /* ================= ROLE HELPERS ================= */

  const isAuthenticated = Boolean(user);

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
  }), [user, token, loading, login, logout]);

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