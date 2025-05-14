import authService from "./authService";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

class CanvasService {
  constructor() {
    console.log("CanvasService initialized with API_URL:", API_URL);
  }

  async getCanvases() {
    try {
      console.log("Fetching canvases...");
      const token = authService.getAuthToken();

      if (!token) {
        console.error("No auth token found");
        throw new Error("Authentication required");
      }

      const response = await fetch(`${API_URL}/canvases`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error(
          "Canvas fetch failed:",
          response.status,
          response.statusText
        );
        throw new Error("Failed to fetch canvases");
      }

      const data = await response.json();
      console.log("Canvases fetched successfully:", data);
      return data;
    } catch (error) {
      console.error("getCanvases error:", error);
      throw error;
    }
  }
}

export const canvasService = new CanvasService();
