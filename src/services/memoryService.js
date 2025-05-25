import api from "./api";
import { photoUtils } from "../utils/photoUtils";

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

  updateMemoryTitle: async (id, title) => {
    console.log("memoryService.updateMemoryTitle called:", {
      id,
      title,
    });
    try {
      const response = await api.patch(`/memories/${id}/title`, { title });
      console.log("updateMemoryTitle response:", {
        status: response.status,
        data: response.data,
      });
      return response.data;
    } catch (error) {
      console.error("updateMemoryTitle error:", {
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

  uploadPhotos: async (files, onProgress = () => {}) => {
    const processedFiles = [];
    const totalFiles = files.length;

    for (let i = 0; i < totalFiles; i++) {
      const file = files[i];
      onProgress({
        type: "compression_start",
        fileName: file.name,
        fileIndex: i,
        totalFiles,
      });

      const processedFile = await photoUtils.processImage(file);
      processedFiles.push(processedFile);

      onProgress({
        type: "compression_end",
        fileName: file.name, // Original name for reference
        processedFileName: processedFile.name,
        originalSize: file.size,
        processedSize: processedFile.size,
        fileIndex: i,
        totalFiles,
        wasProcessed:
          file !== processedFile || file.name !== processedFile.name,
      });
    }

    onProgress({
      type: "all_files_processed",
      totalProcessedFiles: processedFiles.length,
    });

    const formData = new FormData();
    for (const pFile of processedFiles) {
      formData.append("photos", pFile);
    }

    const totalSizeToUpload = processedFiles.reduce(
      (sum, f) => sum + f.size,
      0
    );
    onProgress({
      type: "upload_start",
      totalFilesToUpload: processedFiles.length,
      totalSizeToUpload,
    });

    try {
      const response = await api.post("/photos/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      onProgress({
        type: "upload_complete",
        responseData: response.data,
        totalFilesUploaded: processedFiles.length,
      });
      return response.data; // Returns array of { id, state: "N" }
    } catch (error) {
      onProgress({
        type: "upload_error",
        error,
      });
      throw error; // Re-throw the error so the caller can handle it
    }
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
