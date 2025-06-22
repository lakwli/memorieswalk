import { useCallback } from "react";
import { useCanvasElements } from "./useCanvasElements";

/**
 * Hook to provide editing handlers for canvas elements.
 * Returns: { handleElementDoubleClick, handleElementDelete }
 */
export default function useElementEditing() {
  const { editingManager, setNewSelectedElement, removeElement } =
    useCanvasElements();

  // Returns a function suitable for use as a double-click handler
  const handleElementDoubleClick = useCallback(
    (element) => {
      console.log(`🔶 [User]  Double Click ID=${element.id}`);
      return () => {
        editingManager.startEditing(element);
        setNewSelectedElement(element);
        return true;
      };
    },
    [editingManager, setNewSelectedElement]
  );

  // Returns a function suitable for use as a delete handler
  const handleElementDelete = useCallback(
    (element) => {
      if (element.cleanup) {
        element.cleanup();
      }
      removeElement(element.id);
    },
    [removeElement]
  );

  return { handleElementDoubleClick, handleElementDelete };
}
