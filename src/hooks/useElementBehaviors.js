import { createCanvasElement } from "../components/canvas/elements/elementFactory.js";
import { ELEMENT_TYPES } from "../constants/elementTypes.js";

class ElementBehaviors {
  handleElementDoubleClick = (element) => {
    return () => {
      this.editingManager.startEditing(element);
      this.setSelectedElement(element);
      return true;
    };
  };

  createPhotoElementFromData = (photoData, photoConfig, img, objectURL) => {
    const fallbackPosition = { x: 100, y: 100 };
    const props = {
      ...photoData,
      image: img,
      objectURL,
      x: photoConfig.x !== undefined ? photoConfig.x : fallbackPosition.x,
      y: photoConfig.y !== undefined ? photoConfig.y : fallbackPosition.y,
      width: photoConfig.width || img.naturalWidth / 4,
      height: photoConfig.height || img.naturalHeight / 4,
      rotation: photoConfig.rotation || 0,
      originalWidth: photoData.originalWidth || img.naturalWidth,
      originalHeight: photoData.originalHeight || img.naturalHeight,
      size: photoData.size || 0,
    };
    return createCanvasElement(ELEMENT_TYPES.PHOTO, props);
  };
  createTextElementFromData = (textData, textConfig = {}) => {
    const fallbackPosition = { x: 100, y: 100 };
    const fallbackSize = { width: 200, height: 50 };

    const props = {
      ...textData,
      ...textConfig,
      id: String(
        textData.id || `text-${Math.random().toString(36).substr(2, 9)}`
      ),
      x:
        textData.x !== undefined
          ? textData.x
          : textConfig.x !== undefined
          ? textConfig.x
          : fallbackPosition.x,
      y:
        textData.y !== undefined
          ? textData.y
          : textConfig.y !== undefined
          ? textConfig.y
          : fallbackPosition.y,
      width: textData.width || textConfig.width || fallbackSize.width,
      height: textData.height || textConfig.height || fallbackSize.height,
      rotation: textData.rotation || textConfig.rotation || 0,
      fontSize: textData.fontSize || textConfig.fontSize || 24,
      fontFamily: textData.fontFamily || textConfig.fontFamily || "Arial",
      color: textData.color || textConfig.color || "#222",
      text: textData.text || "",
      align: textData.align || textConfig.align || "left",
      // Add any other properties your TextElement expects
    };

    return createCanvasElement(ELEMENT_TYPES.TEXT, props);
  };
  handleElementDelete = (element) => {
    if (element.cleanup) {
      element.cleanup();
    }
    this.removeElement(element.id);
  };

  addElementIntoCanvas = (element, stageRef) => {
    const stage = stageRef.current;
    if (stage) {
      const stageWidth = stage.width();
      const stageHeight = stage.height();
      const stageScale = stage.scaleX();
      const stagePosition = { x: stage.x(), y: stage.y() };
      const viewportCenterX = (-stagePosition.x + stageWidth / 2) / stageScale;
      const viewportCenterY = (-stagePosition.y + stageHeight / 2) / stageScale;
      const bounds = element.getBounds();
      const finalX = viewportCenterX - bounds.width / 2;
      const finalY = viewportCenterY - bounds.height / 2;
      element.x = finalX;
      element.y = finalY;
      let positionCheckCount = 0;
      const monitorPosition = () => {
        positionCheckCount++;
        if (positionCheckCount < 10) {
          setTimeout(monitorPosition, 100);
        }
      };
      setTimeout(monitorPosition, 50);
    } else {
      console.warn("🎯 No stage reference available for positioning");
    }
    return element;
  };
}

const elementBehaviors = new ElementBehaviors();
export default elementBehaviors;
