import authService from "./authService";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

class MemoryService {
  constructor() {
    console.log("MemoryService initialized with API_URL:", API_URL);
  }

  getApiUrl() {
    return API_URL;
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

  async createMemory(title, description = "") {
    try {
      const token = authService.getAuthToken();

      if (!token) {
        throw new Error("Authentication required");
      }

      const body = { title };
      if (description) {
        body.description = description;
      }

      const response = await fetch(`${API_URL}/memories`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        let errorMessage = `Failed to create memory (${response.status})`;
        try {
          const errorData = await response.json();
          if (errorData && errorData.error) {
            errorMessage = `${errorMessage}: ${errorData.error}`;
          }
        } catch (_e) {
          // Changed 'e' to '_e' to indicate it's intentionally unused
          // Ignore if response is not JSON or other parsing error
        }
        throw new Error(errorMessage);
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

      const payload = {
        ...updates,
        client_updated_at: new Date().toISOString(), // Add client timestamp
      };

      const response = await fetch(`${API_URL}/memories/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload), // Send updated payload
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

  async uploadPhotosToLibrary(files) {
    try {
      const token = authService.getAuthToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const formData = new FormData();
      const filesArray = Array.from(files); // Convert FileList to Array

      if (filesArray.length === 0) {
        throw new Error("No files provided for upload.");
      }

      filesArray.forEach((file) => {
        if (file instanceof File) {
          formData.append("photos", file, file.name);
        } else {
          // This case should ideally not happen if `files` is from an input element
          console.warn("Item in files array is not a File object:", file);
        }
      });

      if (!formData.has("photos")) {
        // This means after iterating, no valid files were actually appended.
        throw new Error(
          "No valid files found to upload after processing input."
        );
      }

      const response = await fetch(`${API_URL}/memories/photos`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = `Failed to upload photos (${response.status})`;
        try {
          const errorData = await response.json();
          if (errorData && errorData.error) {
            errorMessage = `${errorMessage}: ${errorData.error}`;
          } else {
            errorMessage = `${errorMessage}: ${response.statusText}`;
          }
        } catch {
          errorMessage = `${errorMessage}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error uploading photos to library:", error);
      throw error;
    }
  }

  async getPhotoBlobViewAuthenticated(photoId) {
    try {
      const token = authService.getAuthToken();
      if (!token) {
        throw new Error("Authentication required to view photo");
      }

      const response = await fetch(
        `${this.getApiUrl()}/memories/photos/${photoId}/view-authenticated`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch authenticated photo ${photoId} (${response.status})`
        );
      }
      const blob = await response.blob();
      return blob;
    } catch (error) {
      console.error(
        `Error fetching authenticated photo blob ${photoId}:`,
        error
      );
      throw error;
    }
  }

  async linkPhotosToMemory(memoryId, photoIds) {
    try {
      const token = authService.getAuthToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      if (!Array.isArray(photoIds) || photoIds.length === 0) {
        throw new Error("photoIds must be a non-empty array.");
      }

      const response = await fetch(`${API_URL}/memories/${memoryId}/photos`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ photo_ids: photoIds }),
      });

      if (!response.ok) {
        let errorMessage = `Failed to link photos to memory (${response.status})`;
        try {
          const errorData = await response.json();
          if (errorData && errorData.error) {
            errorMessage = `${errorMessage}: ${errorData.error}`;
          } else {
            errorMessage = `${errorMessage}: ${response.statusText}`;
          }
        } catch {
          errorMessage = `${errorMessage}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error linking photos to memory ${memoryId}:`, error);
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

  // New method to create a memory view configuration
  async createMemoryViewConfiguration(memoryId, viewConfigData) {
    try {
      const token = authService.getAuthToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const payload = {
        ...viewConfigData,
        client_updated_at: new Date().toISOString(),
      };

      const response = await fetch(
        `${API_URL}/memories/${memoryId}/view-configurations`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        let errorMessage = `Failed to create memory view configuration (${response.status})`;
        try {
          const errorData = await response.json();
          if (errorData && errorData.error) {
            errorMessage = `${errorMessage}: ${errorData.error}`;
          } else {
            errorMessage = `${errorMessage}: ${response.statusText}`;
          }
        } catch {
          errorMessage = `${errorMessage}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(
        `Error creating memory view configuration for memory ${memoryId}:`,
        error
      );
      throw error;
    }
  }

  // New method to update a memory view configuration
  async updateMemoryViewConfiguration(memoryId, configId, viewConfigUpdates) {
    try {
      const token = authService.getAuthToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const payload = {
        ...viewConfigUpdates,
        client_updated_at: new Date().toISOString(),
      };

      const response = await fetch(
        `${API_URL}/memories/${memoryId}/view-configurations/${configId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        let errorMessage = `Failed to update memory view configuration ${configId} (${response.status})`;
        try {
          const errorData = await response.json();
          if (errorData && errorData.error) {
            errorMessage = `${errorMessage}: ${errorData.error}`;
          } else {
            errorMessage = `${errorMessage}: ${response.statusText}`;
          }
        } catch {
          errorMessage = `${errorMessage}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(
        `Error updating memory view configuration ${configId} for memory ${memoryId}:`,
        error
      );
      throw error;
    }
  }
}

export const memoryService = new MemoryService();
export default memoryService;
