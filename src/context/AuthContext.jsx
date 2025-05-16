import { createContext, useContext, useState, useEffect } from "react";
import authService from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(authService.getAuthToken()); // Manage token in state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = () => {
      const currentToken = authService.getAuthToken();
      const currentUser = authService.getCurrentUser();
      if (currentToken && currentUser) {
        setUser(currentUser);
        setToken(currentToken);
        setIsAuthenticated(true);
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = (userData, authToken) => {
    // Renamed token param to avoid conflict
    setUser(userData);
    setToken(authToken); // Set token state
    setIsAuthenticated(true);
    authService.setAuthToken(authToken);
    authService.setCurrentUser(userData);
  };

  const logout = () => {
    setUser(null);
    setToken(null); // Clear token state
    setIsAuthenticated(false);
    authService.logout();
  };

  if (isLoading) {
    return null; // or loading spinner
  }

  return (
    <AuthContext.Provider
      value={{ user, setUser, token, isAuthenticated, login, logout }}
    >
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
