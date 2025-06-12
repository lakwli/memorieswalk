import { useCallback, useMemo } from "react";

export const useElementBehaviors = (
  elements,
  setElements,
  selectedElement,
  setSelectedElement,
  editingElement,
  setEditingElement
) => {
  // Central Editing State Manager - wrapped in useMemo to prevent recreation
  const editingManager = useMemo(
    () => ({
      // Check if element is in editing mode
      isElementEditing: (elementId) => {
        return editingElement?.id === elementId;
      },

      // Start editing mode for an element
      startEditing: (element) => {
        setEditingElement(element);
      },

      // End editing mode
      endEditing: () => {
        setEditingElement(null);
      },

      // Update element while preserving editing state
      updateElementInEditMode: (elementId, updates) => {
        console.log("📝 updateElementInEditMode called:", {
          elementId,
          updates,
          timestamp: new Date().toISOString(),
        });

        setElements((prev) => {
          console.log(
            "📝 setElements prev state:",
            prev.map((el) => ({ id: el.id, type: el.type }))
          );

          const newElements = prev.map((el) => {
            if (el.id === elementId) {
              console.log(
                "📝 Updating element with Object.assign:",
                el.id,
                "with:",
                updates
              );
              // Preserve the class instance by updating properties directly
              // This prevents creating new object references that could disrupt editing state
              Object.assign(el, updates);
              return el;
            }
            return el;
          });

          console.log(
            "📝 setElements new state:",
            newElements.map((el) => ({ id: el.id, type: el.type }))
          );
          console.log("📝 Element updated, editing state preserved");
          return newElements;
        });
        // editingElement state persists because it's managed separately
      },
    }),
    [editingElement, setEditingElement, setElements]
  );

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

  // Common click handler - SIMPLIFIED (no more activeTool)
  const handleElementClick = useCallback(
    (element) => {
      return () => {
        // Only clear editing if clicking on a different element
        if (editingElement && editingElement.id !== element.id) {
          setEditingElement(null);
        }
        setSelectedElement(element);
        // No more activeTool setting - keeps UI clean and simple
      };
    },
    [setSelectedElement, setEditingElement, editingElement]
  );

  // Common double-click handler - now has stable editingManager dependency
  const handleElementDoubleClick = useCallback(
    (element) => {
      return (e) => {
        // Start editing mode for the element
        editingManager.startEditing(element);

        // Also ensure it's selected
        setSelectedElement(element);

        // Allow event to bubble to specific renderer handlers
        return true;
      };
    },
    [editingManager, setSelectedElement]
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

  return {
    addElementIntoCanvas,
    handleElementDragStart,
    handleElementDragEnd,
    handleElementClick,
    handleElementDoubleClick,
    handleElementTransform,
    handleElementDelete,
    editingManager,
  };
};
