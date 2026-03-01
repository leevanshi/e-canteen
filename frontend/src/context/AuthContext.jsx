import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ================= HELPERS ================= */
  const clearAuth = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  const normalizeUser = (storedUser) => {
    try {
      const parsed = JSON.parse(storedUser);

      if (!parsed || typeof parsed !== "object") return null;

      return {
        ...parsed,
        role: (parsed.role || "").toLowerCase(), // 🔥 safe role handling
      };
    } catch (err) {
      console.error("User parse error:", err);
      return null;
    }
  };

  /* ================= RESTORE AUTH ================= */
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (storedToken && storedUser) {
        const parsedUser = normalizeUser(storedUser);

        if (!parsedUser || !parsedUser.role) {
          clearAuth();
        } else {
          setToken(storedToken);
          setUser(parsedUser);
        }
      } else {
        clearAuth();
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
    if (!userData || !authToken) {
      throw new Error("Invalid login data");
    }

    const normalizedUser = {
      ...userData,
      role: (userData.role || "").toLowerCase(),
    };

    if (!normalizedUser.role) {
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

    // 🔥 safer redirect (no infinite reload issues)
    if (!window.location.pathname.includes("/login")) {
      window.location.href = "/login";
    }
  };

  /* ================= SYNC BETWEEN TABS ================= */
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