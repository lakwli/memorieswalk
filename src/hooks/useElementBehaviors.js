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
  /**
  console.log("🔍 useElementBehaviors called with:", {
    updateElement: !!updateElement,
    setSelectedElement: !!setSelectedElement,
    editingManager: !!editingManager,
    removeElement: !!removeElement,
  });
 */
  // Common double-click handler

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
    /**
    console.log(
      "🎯 addElementIntoCanvas called for:",
      element.id,
      element.type
    );
   
    console.log("🎯 Element size BEFORE positioning:", {
      elementId: element.id,
      elementType: element.type,
      elementWidth: element.width,
      elementHeight: element.height,
      originalWidth: element.originalWidth,
      originalHeight: element.originalHeight,
    });
 */
    const stage = stageRef.current;
    if (stage) {
      const stageWidth = stage.width();
      const stageHeight = stage.height();
      const stageScale = stage.scaleX();
      const stagePosition = { x: stage.x(), y: stage.y() };

      const viewportCenterX = (-stagePosition.x + stageWidth / 2) / stageScale;
      const viewportCenterY = (-stagePosition.y + stageHeight / 2) / stageScale;

      const bounds = element.getBounds();
      /**
      console.log("🎯 Detailed positioning debug:", {
        elementType: element.type,
        stage: { width: stageWidth, height: stageHeight, scale: stageScale },
        stagePosition: stagePosition,
        viewportCenter: { x: viewportCenterX, y: viewportCenterY },
        elementBounds: bounds,
        elementSize: { width: element.width, height: element.height },
      });
 */
      // ✅ Calculate final position
      const finalX = viewportCenterX - bounds.width / 2;
      const finalY = viewportCenterY - bounds.height / 2;
      /**
      console.log("🔍 POSITIONING STEP BY STEP:", {
        elementType: element.type,
        elementId: element.id,
        step1_viewportCenter: { x: viewportCenterX, y: viewportCenterY },
        step2_elementSize: { width: bounds.width, height: bounds.height },
        step3_calculation: {
          finalX: `${viewportCenterX} - ${bounds.width}/2 = ${finalX}`,
          finalY: `${viewportCenterY} - ${bounds.height}/2 = ${finalY}`,
        },
        step4_beforeUpdate: { x: element.x, y: element.y },
      });
 */
      // ✅ Set position
      element.x = finalX;
      element.y = finalY;
      /**
      console.log("🎯 Element positioned:", {
        elementId: element.id,
        elementType: element.type,
        calculatedPosition: { x: finalX, y: finalY },
        actualPosition: { x: element.x, y: element.y },
        positionMatch: element.x === finalX && element.y === finalY,
      });
 */
      // ✅ ADD POSITION MONITORING
      //console.log("🔍 SETTING UP POSITION MONITOR for:", element.id);

      // Monitor position changes over time
      let positionCheckCount = 0;
      const monitorPosition = () => {
        positionCheckCount++;
        /**
        const currentPos = { x: element.x, y: element.y };
      
        console.log(
          `🔍 POSITION CHECK #${positionCheckCount} for ${element.type} ${element.id}:`,
          {
            timestamp: new Date().toISOString(),
            currentPosition: currentPos,
            expectedPosition: { x: finalX, y: finalY },
            positionChanged: currentPos.x !== finalX || currentPos.y !== finalY,
            drift: {
              x: currentPos.x - finalX,
              y: currentPos.y - finalY,
            },
          }
        ); */

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

  //return {
  //addElementIntoCanvas,
  //handleElementClick,
  //handleElementDoubleClick,
  //handleElementTransform,
  //handleElementDelete,
  //};

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
