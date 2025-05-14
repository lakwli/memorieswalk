import { createContext, useContext, useState, useEffect } from "react";
import authService from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = () => {
      const token = authService.getAuthToken();
      const user = authService.getCurrentUser();
      if (token && user) {
        setUser(user);
        setIsAuthenticated(true);
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = (userData, token) => {
    setUser(userData);
    setIsAuthenticated(true);
    authService.setAuthToken(token);
    authService.setCurrentUser(userData);
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    authService.logout();
  };

  if (isLoading) {
    return null; // or loading spinner
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
