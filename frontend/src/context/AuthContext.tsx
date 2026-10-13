import React, { createContext, useContext, useState, useEffect } from "react";
import apiClient from "../services/api";
import { User, UserRole } from "../types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("authUser");
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("authToken");
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const verifySession = async () => {
      const storedToken = localStorage.getItem("authToken");
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await apiClient.get("/auth/me");
        if (response.data?.user) {
          setUser(response.data.user);
          localStorage.setItem("authUser", JSON.stringify(response.data.user));
        }
      } catch (error) {
        console.warn("Session check failed, clearing invalid session:", error);
        localStorage.removeItem("authToken");
        localStorage.removeItem("authUser");
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    verifySession();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiClient.post("/auth/login", { email, password });
      if (response.data?.token && response.data?.user) {
        const receivedToken = response.data.token;
        const receivedUser = response.data.user;

        setToken(receivedToken);
        setUser(receivedUser);

        localStorage.setItem("authToken", receivedToken);
        localStorage.setItem("authUser", JSON.stringify(receivedUser));
        return true;
      }
      return false;
    } catch (error: any) {
      console.error("Login request error:", error);
      throw error;
    }
  };

  const logout = () => {
    apiClient.post("/auth/logout").catch(() => {});
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    setUser(null);
    setToken(null);
  };

  const hasRole = (...roles: UserRole[]): boolean => {
    if (!user) return false;
    if (user.role === "superadmin") return true;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
