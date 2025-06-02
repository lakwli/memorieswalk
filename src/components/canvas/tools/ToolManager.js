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
    this.activeTool = null;
  }

  /**
   * Set the active tool
   */
  setActiveTool(toolType) {
    this.activeTool = toolType;
  }

  /**
   * Get the active tool
   */
  getActiveTool() {
    return this.activeTool;
  }

  /**
   * Get a specific tool
   */
  getTool(toolType) {
    return this.tools[toolType];
  }

  /**
   * Handle stage click based on active tool
   */
  handleStageClick(e, addElement, setSelectedElement) {
    if (!this.activeTool) return null;

    const tool = this.tools[this.activeTool];
    if (!tool) return null;

    if (this.activeTool === ELEMENT_TYPES.TEXT) {
      const stage = this.canvasConfig.stageRef.current;
      const pointer = stage.getPointerPosition();
      if (!pointer) return null;

      const elementData = tool.createTextFromStageClick(
        pointer,
        this.canvasConfig.stagePosition,
        this.canvasConfig.stageScale
      );

      const newElement = addElement(elementData.type, elementData);
      setSelectedElement(newElement);
      this.setActiveTool(null);
      return newElement;
    }

    return null;
  }

  /**
   * Handle file upload based on tool type
   */
  async handleFileUpload(files, elementStates, addElements) {
    const photoTool = this.tools[ELEMENT_TYPES.PHOTO];
    const photoElements = await photoTool.createPhotoElementsFromFiles(
      files,
      elementStates
    );

    if (photoElements.length > 0) {
      addElements(photoElements);
    }

    return photoElements;
  }

  /**
   * Add text element at viewport center
   */
  addTextAtCenter(addElement, setSelectedElement) {
    const textTool = this.tools[ELEMENT_TYPES.TEXT];
    const elementData = textTool.createTextAtViewportCenter(
      this.canvasConfig.stageRef,
      this.canvasConfig.stageScale,
      this.canvasConfig.stagePosition
    );

    const newElement = addElement(elementData.type, elementData);
    setSelectedElement(newElement);
    this.setActiveTool(null);
    return newElement;
  }

  /**
   * Handle text drop operation
   */
  handleTextDrop(droppedText, addElement, setSelectedElement) {
    const textTool = this.tools[ELEMENT_TYPES.TEXT];
    const elementData = textTool.createTextFromDrop(
      this.canvasConfig.stageRef,
      droppedText
    );

    const newElement = addElement(elementData.type, elementData);
    setSelectedElement(newElement);
    this.setActiveTool(null);
    return newElement;
  }

  /**
   * Get cursor style for active tool
   */
  getCursorStyle() {
    if (!this.activeTool) return "grab";

    const tool = this.tools[this.activeTool];
    return tool?.getCursorStyle?.() || "default";
  }

  /**
   * Update canvas configuration for all tools
   */
  updateCanvasConfig(newConfig) {
    this.canvasConfig = { ...this.canvasConfig, ...newConfig };
    Object.values(this.tools).forEach((tool) => {
      if (tool.updateCanvasConfig) {
        tool.updateCanvasConfig(this.canvasConfig);
      }
    });
  }
}
