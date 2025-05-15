import authService from "./authService";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

class MemoryService {
  constructor() {
    console.log("MemoryService initialized with API_URL:", API_URL);
  }

  async getMemories() {
    try {
      console.log("Fetching memories...");
      const token = authService.getAuthToken();

      if (!token) {
        console.error("No auth token found");
        throw new Error("Authentication required");
      }

      const response = await fetch(`${API_URL}/memories`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error(
          "Memory fetch failed:",
          response.status,
          response.statusText
        );
        throw new Error("Failed to fetch memories");
      }

      const data = await response.json();
      console.log("Memories fetched successfully:", data);
      return data;
    } catch (error) {
      console.error("getMemories error:", error);
      throw error;
    }
  }

  async getMemory(id) {
    try {
      const token = authService.getAuthToken();

      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`${API_URL}/memories/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch memory (${response.status})`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching memory ${id}:`, error);
      throw error;
    }
  }

  async createMemory(title, viewType = "canvas") {
    try {
      const token = authService.getAuthToken();

      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`${API_URL}/memories`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, viewType }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create memory (${response.status})`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error creating memory:", error);
      throw error;
    }
  }

  async updateMemory(id, updates) {
    try {
      const token = authService.getAuthToken();

      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`${API_URL}/memories/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`Failed to update memory (${response.status})`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error updating memory ${id}:`, error);
      throw error;
    }
  }

  async deleteMemory(id) {
    try {
      const token = authService.getAuthToken();

      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`${API_URL}/memories/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete memory (${response.status})`);
      }

      return true;
    } catch (error) {
      console.error(`Error deleting memory ${id}:`, error);
      throw error;
    }
  }

  async addPhotoToMemory(memoryId, photoData) {
    try {
      const token = authService.getAuthToken();

      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`${API_URL}/memories/${memoryId}/photos`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(photoData),
      });

      if (!response.ok) {
        throw new Error(`Failed to add photo (${response.status})`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error adding photo to memory ${memoryId}:`, error);
      throw error;
    }
  }

  async getPhotosForMemory(memoryId) {
    try {
      const token = authService.getAuthToken();

      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`${API_URL}/memories/${memoryId}/photos`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch photos (${response.status})`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching photos for memory ${memoryId}:`, error);
      throw error;
    }
  }

  async createShareLink(memoryId, options = {}) {
    try {
      const token = authService.getAuthToken();

      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`${API_URL}/memories/${memoryId}/share`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        throw new Error(`Failed to create share link (${response.status})`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error creating share link for memory ${memoryId}:`, error);
      throw error;
    }
  }
}

export const memoryService = new MemoryService();
export default memoryService;
