const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

class AuthService {
  constructor() {
    this.token = localStorage.getItem("token");
    this.currentUser = JSON.parse(localStorage.getItem("user"));
  }

  getCurrentUser() {
    return this.currentUser;
  }

  setAuthToken(token) {
    this.token = token;
    localStorage.setItem("token", token);
  }

  getAuthToken() {
    return this.token;
  }

  setCurrentUser(user) {
    this.currentUser = user;
    localStorage.setItem("user", JSON.stringify(user));
  }

  async login(username, password) {
    const url = `${API_URL}/auth/login`;
    console.log("Attempting login at:", url); // Debug log

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Login failed");
      }

      const data = await response.json();
      this.setAuthToken(data.token);
      this.setCurrentUser(data.user);
      return data;
    } catch (error) {
      console.error("Login request failed:", error);
      throw error;
    }
  }

  logout() {
    this.token = null;
    this.currentUser = null;
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }
}

export default new AuthService();
