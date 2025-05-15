import { memoryService } from "./memoryService";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

/**
 * Legacy service for backward compatibility.
 * Uses the new memoryService under the hood.
 */
class CanvasService {
  constructor() {
    console.log("CanvasService initialized (legacy compatibility wrapper)");
  }

  async getCanvases() {
    try {
      console.log("Fetching canvases (using memory service)...");
      // Use the memory service to get memories
      const memories = await memoryService.getMemories();

      // Map memories to the old canvas format for backward compatibility
      const canvases = memories.map((memory) => ({
        id: memory.id,
        user_id: memory.user_id,
        title: memory.title,
        canvas_data: memory.memory_data,
        thumbnail_url: memory.thumbnail_url,
        created_at: memory.created_at,
        updated_at: memory.updated_at,
      }));

      console.log("Canvases mapped from memories:", canvases);
      return canvases;
    } catch (error) {
      console.error("getCanvases error:", error);
      throw error;
    }
  }

  async getCanvas(id) {
    try {
      // Use the memory service to get a memory by ID
      const memory = await memoryService.getMemory(id);

      // Map to canvas format
      return {
        id: memory.id,
        user_id: memory.user_id,
        title: memory.title,
        canvas_data: memory.memory_data,
        thumbnail_url: memory.thumbnail_url,
        created_at: memory.created_at,
        updated_at: memory.updated_at,
      };
    } catch (error) {
      console.error(`getCanvas error for ID ${id}:`, error);
      throw error;
    }
  }

  async createCanvas(title) {
    try {
      // Use memory service to create a new memory with canvas view type
      const memory = await memoryService.createMemory(title, "canvas");

      // Return in canvas format
      return {
        id: memory.id,
        user_id: memory.user_id,
        title: memory.title,
        canvas_data: memory.memory_data,
        thumbnail_url: memory.thumbnail_url,
        created_at: memory.created_at,
        updated_at: memory.updated_at,
      };
    } catch (error) {
      console.error("createCanvas error:", error);
      throw error;
    }
  }

  async updateCanvas(id, updates) {
    try {
      // Map canvas updates to memory updates
      const memoryUpdates = {
        title: updates.title,
        memory_data: updates.canvas_data,
        thumbnail_url: updates.thumbnail_url,
      };

      // Use memory service to update
      const memory = await memoryService.updateMemory(id, memoryUpdates);

      // Return in canvas format
      return {
        id: memory.id,
        user_id: memory.user_id,
        title: memory.title,
        canvas_data: memory.memory_data,
        thumbnail_url: memory.thumbnail_url,
        created_at: memory.created_at,
        updated_at: memory.updated_at,
      };
    } catch (error) {
      console.error(`updateCanvas error for ID ${id}:`, error);
      throw error;
    }
  }

  async deleteCanvas(id) {
    try {
      // Use memory service to delete
      return await memoryService.deleteMemory(id);
    } catch (error) {
      console.error(`deleteCanvas error for ID ${id}:`, error);
      throw error;
    }
  }
}

export const canvasService = new CanvasService();
export default canvasService;
