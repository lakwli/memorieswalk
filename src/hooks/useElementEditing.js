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
      if (element.cleanup) {
        element.cleanup();
      }
      removeElement(element.id);
    },
    [removeElement]
  );

  return { onEditStart, onEditEnd, onEditCancel, handleElementDelete };
}
