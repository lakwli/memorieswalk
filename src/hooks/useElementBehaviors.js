import { useCallback } from "react";

export const useElementBehaviors = (
  elements,
  setElements,
  selectedElement,
  setSelectedElement,
  editingElement,
  setEditingElement
) => {
  // Central Editing State Manager
  const editingManager = {
    // Check if element is in editing mode
    isElementEditing: useCallback(
      (elementId) => {
        return editingElement?.id === elementId;
      },
      [editingElement]
    ),

    // Start editing mode for an element
    startEditing: useCallback(
      (element) => {
        setEditingElement(element);
      },
      [setEditingElement]
    ),

    // End editing mode
    endEditing: useCallback(() => {
      setEditingElement(null);
    }, [setEditingElement]),

    // Update element while preserving editing state
    updateElementInEditMode: useCallback(
      (elementId, updates) => {
        console.log("📝 updateElementInEditMode called with:", {
          elementId,
          updates,
        });
        setElements((prev) =>
          prev.map((el) => (el.id === elementId ? { ...el, ...updates } : el))
        );
        console.log("📝 Element updated, editing state should persist");
        // editingElement state persists because it's managed separately
      },
      [setElements]
    ),
  };

  // Common drag handlers
  const handleElementDragStart = useCallback(() => {
    return (e) => {
      const stage = e.target.getStage();
      stage.container().style.cursor = "grabbing";
    };
  }, []);

  const handleElementDragEnd = useCallback(
    (element) => {
      return (e) => {
        const stage = e.target.getStage();
        stage.container().style.cursor = "move";
        const node = e.target;

        setElements((prev) =>
          prev.map((el) => {
            if (el.id === element.id) {
              // Preserve the class instance by updating properties directly
              el.x = node.x();
              el.y = node.y();
              return el;
            }
            return el;
          })
        );
      };
    },
    [setElements]
  );

  // Common mouse handlers
  const handleElementMouseEnter = useCallback(() => {
    return (e) => {
      const stage = e.target.getStage();
      stage.container().style.cursor = "move";
    };
  }, []);

  const handleElementMouseLeave = useCallback(() => {
    return (e) => {
      const stage = e.target.getStage();
      stage.container().style.cursor = "grab";
    };
  }, []);

  // Common click handler
  const handleElementClick = useCallback(
    (element) => {
      return () => setSelectedElement(element);
    },
    [setSelectedElement]
  );

  // Common transform handler
  const handleElementTransform = useCallback(
    (element) => {
      return (e) => {
        const node = e.target;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();

        // Reset scale to avoid compounding
        node.scaleX(1);
        node.scaleY(1);

        setElements((prev) =>
          prev.map((el) => {
            if (el.id === element.id) {
              // Preserve the class instance by updating properties directly
              el.x = node.x();
              el.y = node.y();

              // Handle textbox elements: resize the container, not the text
              if (el.type === "text") {
                // For text elements, scale the textbox dimensions
                const currentWidth = el.width || 200;
                const currentHeight = el.height || 60;
                el.width = Math.round(currentWidth * scaleX);
                el.height = Math.round(currentHeight * scaleY);
              } else {
                // For other elements (photos, etc.), scale the element directly
                el.width = Math.round(node.width() * scaleX);
                el.height = Math.round(node.height() * scaleY);
              }

              el.rotation = node.rotation();
              return el;
            }
            return el;
          })
        );
      };
    },
    [setElements]
  );

  // Delete handler
  const handleElementDelete = useCallback(
    (element) => {
      // Cleanup if needed
      if (element.cleanup) {
        element.cleanup();
      }

      // Remove from elements array
      setElements((prev) => prev.filter((el) => el.id !== element.id));

      // Clear selection
      if (selectedElement?.id === element.id) {
        setSelectedElement(null);
      }
    },
    [setElements, selectedElement, setSelectedElement]
  );

  return {
    handleElementDragStart,
    handleElementDragEnd,
    handleElementMouseEnter,
    handleElementMouseLeave,
    handleElementClick,
    handleElementTransform,
    handleElementDelete,
    editingManager,
  };
};
