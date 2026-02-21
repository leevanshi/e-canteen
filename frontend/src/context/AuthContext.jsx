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

  const parseUser = (storedUser) => {
    try {
      const parsed = JSON.parse(storedUser);
      return {
        ...parsed,
        role: parsed?.role?.toLowerCase(), // ✅ normalize role
      };
    } catch {
      return null;
    }
  };

  /* ================= RESTORE AUTH ================= */
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (storedToken && storedUser) {
        const parsedUser = parseUser(storedUser);

        if (!parsedUser) {
          clearAuth();
        } else {
          setToken(storedToken);
          setUser(parsedUser);
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
    if (!authToken || !userData) {
      throw new Error("Invalid login data received");
    }

    try {
      const normalizedUser = {
        ...userData,
        role: userData?.role?.toLowerCase(),
      };

      localStorage.setItem("token", authToken);
      localStorage.setItem("user", JSON.stringify(normalizedUser));

      setToken(authToken);
      setUser(normalizedUser);
    } catch (err) {
      console.error("Login storage failed:", err);
      throw new Error("Login failed");
    }
  };

  /* ================= LOGOUT ================= */
  const logout = () => {
    clearAuth();
    window.location.replace("/login"); // ✅ force sync everywhere
  };

  /* ================= ROLE HELPERS ================= */
  const isAdmin = user?.role === "admin";
  const isStudent = user?.role === "student";

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        isAuthenticated: !!token,
        isAdmin,
        isStudent,
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