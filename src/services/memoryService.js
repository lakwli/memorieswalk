import api from "./api";

export const memoryService = {
  // Memory CRUD operations
  getAllMemories: async () => {
    const response = await api.get("/memories");
    return response.data;
  },

  getMemory: async (id) => {
    const response = await api.get(`/memories/${id}`);
    return response.data;
  },

  createMemory: async (memoryData) => {
    const response = await api.post("/memories", memoryData);
    return response.data;
  },

  updateMemory: async (id, memoryData) => {
    console.log("memoryService.updateMemory called:", {
      id,
      data: JSON.stringify(memoryData, null, 2),
    });
    try {
      const response = await api.put(`/memories/${id}`, memoryData);
      console.log("updateMemory response:", {
        status: response.status,
        data: response.data,
      });
      return response.data;
    } catch (error) {
      console.error("updateMemory error:", {
        message: error.message,
        response: error.response?.data,
      });
      throw error;
    }
  },

  deleteMemory: async (id) => {
    await api.delete(`/memories/${id}`);
  },

  // Photo operations with state management
  uploadPhotos: async (files) => {
    const formData = new FormData();
    for (let file of files) {
      formData.append("photos", file);
    }
    const response = await api.post("/photos/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data; // Returns array of { id, state: "N" }
  },

  getPhoto: async (photoId, state) => {
    const response = await api.get(
      `/photos/retrieve/${photoId}?state=${state}`,
      {
        responseType: "blob",
      }
    );
    return response.data;
  },

  // Memory view configuration
  createMemoryViewConfiguration: async (memoryId, config) => {
    const response = await api.post(
      `/memories/${memoryId}/view-configurations`,
      config
    );
    return response.data;
  },

  updateMemoryViewConfiguration: async (memoryId, configId, config) => {
    const response = await api.put(
      `/memories/${memoryId}/view-configurations/${configId}`,
      config
    );
    return response.data;
  },
};

// For backward compatibility
export default memoryService;
