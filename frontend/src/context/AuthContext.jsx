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
    } catch (err) {
      console.error("Failed clearing auth:", err);
    }

    setToken(null);
    setUser(null);
  };

  /* ================= NORMALIZE USER ================= */
  const normalizeUser = (rawUser) => {
    if (!rawUser || typeof rawUser !== "object") return null;

    const role = (rawUser.role || "").toLowerCase();

    if (!role) return null;

    return {
      id: rawUser.id || rawUser._id || null,
      email: rawUser.email || "",
      role,
    };
  };

  /* ================= RESTORE AUTH ================= */
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (!storedToken || !storedUser) {
        clearAuth();
        setLoading(false);
        return;
      }

      let parsedUser;

      try {
        parsedUser = JSON.parse(storedUser);
      } catch {
        clearAuth();
        setLoading(false);
        return;
      }

      const normalizedUser = normalizeUser(parsedUser);

      if (!normalizedUser) {
        clearAuth();
        setLoading(false);
        return;
      }

      setToken(storedToken);
      setUser(normalizedUser);
    } catch (err) {
      console.error("Auth restore failed:", err);
      clearAuth();
    } finally {
      setLoading(false);
    }
  }, []);

  /* ================= LOGIN ================= */
  const login = (userData, authToken) => {
    if (!userData) {
      throw new Error("Invalid login user data");
    }

    const normalizedUser = normalizeUser(userData);

    if (!normalizedUser) {
      throw new Error("Invalid user structure");
    }

    const finalToken =
      typeof authToken === "string" && authToken.length > 0
        ? authToken
        : null;

    if (!finalToken) {
      throw new Error("Token missing");
    }

    try {
      localStorage.setItem("token", finalToken);
      localStorage.setItem("user", JSON.stringify(normalizedUser));
    } catch (err) {
      console.error("Storage failed:", err);
    }

    setToken(finalToken);
    setUser(normalizedUser);
  };

  /* ================= LOGOUT ================= */
  const logout = () => {
    clearAuth();

    if (!window.location.pathname.includes("/login")) {
      window.location.href = "/login";
    }
  };

  /* ================= SYNC TABS ================= */
  useEffect(() => {
    const handleStorageChange = () => {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (!storedToken || !storedUser) {
        clearAuth();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  /* ================= ROLE HELPERS ================= */
  const isAdmin = user?.role === "admin";
  const isStudent = user?.role === "student";
  const isFaculty = user?.role === "faculty";

  const isAuthenticated = Boolean(token && user);

  /* ================= MEMOIZED VALUE ================= */
  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      logout,
      isAuthenticated,
      isAdmin,
      isStudent,
      isFaculty,
    }),
    [user, token, loading]
  );

  return (
    <AuthContext.Provider value={value}>
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