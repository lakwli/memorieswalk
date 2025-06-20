import { useCallback } from "react";
import { useMemo } from "react";
// Import PhotoElement from its module (update the path as needed)
import { createCanvasElement } from "../components/canvas/elements/elementFactory.js";
import { ELEMENT_TYPES } from "../constants/elementTypes.js";

export const useElementBehaviors = (
  updateElement,
  setSelectedElement,
  editingManager,
  removeElement
) => {
  const handleElementDoubleClick = useCallback(
    (element) => {
      return () => {
        // Use editingManager from useCanvasElements
        editingManager.startEditing(element);
        setSelectedElement(element);
        return true;
      };
    },
    [editingManager, setSelectedElement]
  );

  const createPhotoElementFromData = useCallback(
    (photoData, photoConfig, img, objectURL) => {
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
    },
    []
  );

  // Delete handler - now properly calls removeElement
  const handleElementDelete = useCallback(
    (element) => {
      // Cleanup if needed
      if (element.cleanup) {
        element.cleanup();
      }

      // Use removeElement from useCanvasElements
      removeElement(element.id);
    },
    [removeElement] // ← Only depend on removeElement
  );

  const addElementIntoCanvas = useCallback((element, stageRef) => {
    const stage = stageRef.current;
    if (stage) {
      const stageWidth = stage.width();
      const stageHeight = stage.height();
      const stageScale = stage.scaleX();
      const stagePosition = { x: stage.x(), y: stage.y() };

      const viewportCenterX = (-stagePosition.x + stageWidth / 2) / stageScale;
      const viewportCenterY = (-stagePosition.y + stageHeight / 2) / stageScale;

      const bounds = element.getBounds();
      // ✅ Calculate final position
      const finalX = viewportCenterX - bounds.width / 2;
      const finalY = viewportCenterY - bounds.height / 2;
      // ✅ Set position
      element.x = finalX;
      element.y = finalY;
      // Monitor position changes over time
      let positionCheckCount = 0;
      const monitorPosition = () => {
        positionCheckCount++;

        if (positionCheckCount < 10) {
          setTimeout(monitorPosition, 100); // Check every 100ms for 1 second
        }
      };

      // Start monitoring after a brief delay
      setTimeout(monitorPosition, 50);
    } else {
      console.warn("🎯 No stage reference available for positioning");
    }

    return element;
  }, []);

  return useMemo(
    () => ({
      addElementIntoCanvas,
      handleElementDoubleClick,
      handleElementDelete,

      createPhotoElementFromData, // Expose the photo element creation function
    }),
    [
      addElementIntoCanvas,
      handleElementDoubleClick,
      handleElementDelete,
      createPhotoElementFromData,
    ]
  );
};
