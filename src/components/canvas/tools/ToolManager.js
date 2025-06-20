// Tool Manager - Coordinates all canvas tools
import { TextTool } from "./TextTool.js";
import { PhotoTool } from "./PhotoTool.js";
import { ELEMENT_TYPES } from "../../../constants";

export class ToolManager {
  constructor(canvasConfig) {
    this.canvasConfig = canvasConfig;
    this.tools = {
      [ELEMENT_TYPES.TEXT]: new TextTool(canvasConfig),
      [ELEMENT_TYPES.PHOTO]: new PhotoTool(canvasConfig),
    };
  }

  /**
   * Get a specific tool
   */
  getTool(toolType) {
    return this.tools[toolType];
  }
}
