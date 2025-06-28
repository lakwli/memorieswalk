import { useCallback } from "react";

/**
 * Hook to provide editing handlers for canvas elements.
 * Returns: { handleElementDoubleClick, handleElementDelete }
 */
export default function useElementEditing({
  editingManager,
  setNewSelectedElement,
  updateElement,
  removeElement,
}) {
  // Returns a function suitable for use as a double-click handler
  const onEditStart = useCallback(
    (element) => {
      //console.log(`🔶 [User]  Double Click ID=${element.id}`);
      return () => {
        editingManager.startEditing(element);
        setNewSelectedElement(element);
        return true;
      };
    },
    [editingManager, setNewSelectedElement]
  );

  const onEditEnd = useCallback(
    (result) => {
      return () => {
        if (result) {
          updateElement(result.id, result.update);
        }
        editingManager.endEditing();
        return true;
      };
    },
    [editingManager, updateElement]
  );

  const onEditCancel = useCallback(() => {
    return () => {
      editingManager.endEditing();
      return true;
    };
  }, [editingManager]);

  // Returns a function suitable for use as a delete handler
  const handleElementDelete = useCallback(
    (element) => {
      console.log(`🔶 [USER-DEL]  Click On toolbar delete ID=${element?.id}`);
      if (element.cleanup) {
        element.cleanup();
      }
      removeElement(element.id);
    },
    [removeElement]
  );

  const handleToolbarUpdate = useCallback(
    (element, updates) => {
      console.log("🎯 TOOLBAR UPDATE TRIGGERED:", {
        element: element.id,
        updates,
      });

      updateElement(element.id, updates);

      console.log("🎯 Update completed via updateElement");
    },
    [updateElement] // ✅ Now depends on updateElement
  );

  return {
    onEditStart,
    onEditEnd,
    onEditCancel,
    handleToolbarUpdate,
    handleElementDelete,
  };
}
