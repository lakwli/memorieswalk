// Text Tool - Handles text element creation and configuration
import { ELEMENT_TYPES } from "../../../constants";

export class TextTool {
  constructor(canvasConfig) {
    this.canvasConfig = canvasConfig;
    this.defaultConfig = {
      text: "New Text",
      fontSize: 24,
      fontFamily: "Arial",
      fill: "#000000",
      fontWeight: "normal",
      fontStyle: "normal",
      textDecoration: "",
      align: "center",
      verticalAlign: "middle",
      width: 200,
      height: 60,
      padding: 10,
      backgroundColor: "",
      backgroundShape: "none", // none, rectangle, rounded, cloud, speech
      borderColor: "",
      borderWidth: 0,
    };

    // Available font families for the text tool
    this.availableFontFamilies = [
      { name: "Arial", type: "Sans-serif" },
      { name: "Georgia", type: "Serif" },
      { name: "Comic Sans MS", type: "Handwritten" },
      { name: "Verdana", type: "Sans-serif" },
      { name: "Times New Roman", type: "Serif" },
    ];

    // Available colors for the text tool
    this.availableColors = [
      "#000000", // Black
      "#FFFFFF", // White
      "#FF0000", // Red
      "#00FF00", // Green
      "#0000FF", // Blue
      "#FFFF00", // Yellow
      "#FF00FF", // Magenta
      "#00FFFF", // Cyan
    ];

    // Available background shapes for the text tool
    this.availableBackgroundShapes = [
      "none",
      "rectangle",
      "rounded",
      "cloud",
      "speech",
    ];
  }

  /**
   * Create a new text element at the specified position
   */
  createTextElement(position, customConfig = {}) {
    const config = { ...this.defaultConfig, ...customConfig };

    return {
      type: ELEMENT_TYPES.TEXT,
      x: position.x,
      y: position.y,
      ...config,
    };
  }

  /**
   * Create text element at viewport center
   */
  createTextAtViewportCenter(stageRef, stageScale, stagePosition) {
    const stage = stageRef.current;
    let textX = 200;
    let textY = 200;

    if (stage) {
      const stageWidth = stage.width();
      const stageHeight = stage.height();

      // Calculate center of current viewport in canvas coordinates
      textX = (-stagePosition.x + stageWidth / 2) / stageScale;
      textY = (-stagePosition.y + stageHeight / 2) / stageScale;
    }

    return this.createTextElement({ x: textX, y: textY });
  }

  /**
   * Create text element from stage click coordinates
   */
  createTextFromStageClick(pointer, stagePosition, stageScale) {
    // Convert screen coordinates to world coordinates
    const worldX = (pointer.x - stagePosition.x) / stageScale;
    const worldY = (pointer.y - stagePosition.y) / stageScale;

    return this.createTextElement({ x: worldX, y: worldY });
  }

  /**
   * Create text element from drag-and-drop operation
   */
  createTextFromDrop(
    stageRef,
    droppedText,
    fallbackPosition = { x: 50, y: 50 }
  ) {
    const stage = stageRef.current;
    const dropPosition = stage
      ? stage.getPointerPosition() || fallbackPosition
      : fallbackPosition;

    return this.createTextElement(dropPosition, { text: droppedText });
  }

  /**
   * Get text creation cursor style
   */
  getCursorStyle() {
    return "text";
  }

  /**
   * Update default text configuration
   */
  updateDefaultConfig(newConfig) {
    this.defaultConfig = { ...this.defaultConfig, ...newConfig };
  }

  /**
   * Get current default configuration
   */
  getDefaultConfig() {
    return { ...this.defaultConfig };
  }
}
