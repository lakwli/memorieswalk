import { useCallback } from "react";

export const useElementBehaviors = (
  updateElement,
  setSelectedElement,
  editingManager,
  removeElement
) => {
  console.log("🔍 useElementBehaviors called with:", {
    updateElement: !!updateElement,
    setSelectedElement: !!setSelectedElement,
    editingManager: !!editingManager,
    removeElement: !!removeElement,
  });

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
    // Calculate center position using element's getBounds()
    const stage = stageRef.current;
    if (stage) {
      const stageWidth = stage.width();
      const stageHeight = stage.height();
      const stageScale = stage.scaleX();
      const stagePosition = { x: stage.x(), y: stage.y() };

      const viewportCenterX = (-stagePosition.x + stageWidth / 2) / stageScale;
      const viewportCenterY = (-stagePosition.y + stageHeight / 2) / stageScale;

      const bounds = element.getBounds();
      element.x = viewportCenterX - bounds.width / 2;
      element.y = viewportCenterY - bounds.height / 2;
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

  const result = {
    addElementIntoCanvas,
    handleElementDoubleClick,

    handleElementDelete,
  };

  console.log("🔍 useElementBehaviors returning handlers:", {
    hasHandleElementDoubleClick: !!result.handleElementDoubleClick,
    hasHandleElementDelete: !!result.handleElementDelete,
  });

  return result;
};
