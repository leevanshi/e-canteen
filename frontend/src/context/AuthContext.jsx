import { createContext, useContext, useEffect, useState } from "react";

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
    } catch {}

    setToken(null);
    setUser(null);
  };

  /* ================= NORMALIZE USER ================= */
  const normalizeUser = (rawUser) => {
    if (!rawUser || typeof rawUser !== "object") return null;

    return {
      id: rawUser.id || rawUser._id || null,
      email: rawUser.email || "",
      role: (rawUser.role || "").toLowerCase(),
    };
  };

  /* ================= RESTORE AUTH ================= */
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (!storedToken || !storedUser) {
        clearAuth();
        return;
      }

      const parsedUser = normalizeUser(JSON.parse(storedUser));

      if (!parsedUser || !parsedUser.role) {
        clearAuth();
        return;
      }

      setToken(storedToken);
      setUser(parsedUser);

    } catch (err) {
      console.error("Auth restore failed:", err);
      clearAuth();
    } finally {
      setLoading(false);
    }
  }, []);

  /* ================= LOGIN ================= */
  const login = (userData, authToken) => {
    if (!userData || !authToken) {
      throw new Error("Invalid login data");
    }

    const normalizedUser = normalizeUser(userData);

    if (!normalizedUser || !normalizedUser.role) {
      throw new Error("User role missing");
    }

    localStorage.setItem("token", authToken);
    localStorage.setItem("user", JSON.stringify(normalizedUser));

    setToken(authToken);
    setUser(normalizedUser);
  };

  /* ================= LOGOUT ================= */
  const logout = () => {
    clearAuth();

    if (!window.location.pathname.includes("/login")) {
      window.location.replace("/login");
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

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        isAuthenticated,
        isAdmin,
        isStudent,
        isFaculty,
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