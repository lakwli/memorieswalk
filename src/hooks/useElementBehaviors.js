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
