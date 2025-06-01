import { useCallback } from "react";

export const useElementBehaviors = (
  elements,
  setElements,
  selectedElement,
  setSelectedElement
) => {
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
          prev.map((el) =>
            el.id === element.id ? { ...el, x: node.x(), y: node.y() } : el
          )
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
          prev.map((el) =>
            el.id === element.id
              ? {
                  ...el,
                  x: node.x(),
                  y: node.y(),
                  width: Math.round(node.width() * scaleX),
                  height: Math.round(node.height() * scaleY),
                  rotation: node.rotation(),
                }
              : el
          )
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
  };
};
