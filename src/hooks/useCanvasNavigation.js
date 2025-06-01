// Custom hook for canvas navigation (zoom and pan) functionality
import { useState, useCallback, useMemo } from "react";

// Constants for zoom limits and behavior
const MIN_SCALE = 0.1;
const MAX_SCALE = 10;
const ZOOM_FACTOR = 1.2;

/**
 * Custom hook for handling canvas navigation (zoom and pan) functionality
 * @param {Object} options - Configuration options
 * @param {React.MutableRefObject} options.stageRef - Reference to the Konva Stage
 * @param {number} options.initialScale - Initial zoom scale (default: 1)
 * @param {Object} options.initialPosition - Initial pan position (default: {x: 0, y: 0})
 * @param {string} options.activeTool - Current active tool (used to enable/disable panning)
 * @returns {Object} Canvas navigation state and handlers
 */
const useCanvasNavigation = ({
  stageRef,
  initialScale = 1,
  initialPosition = { x: 0, y: 0 },
  activeTool = null,
}) => {
  // State for canvas transformation
  const [stageScale, setStageScale] = useState(initialScale);
  const [stagePosition, setStagePosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [lastPointerPosition, setLastPointerPosition] = useState(null);

  // Calculate zoom percentage for display
  const zoomPercentage = useMemo(() => {
    return Math.round(stageScale * 100);
  }, [stageScale]);

  /**
   * Handle zoom functionality either centered on mouse pointer or stage center
   * @param {string} direction - Direction to zoom ('in' or 'out')
   * @param {Object} pointer - Optional pointer position for zooming
   */
  const handleZoom = useCallback(
    (direction, pointer) => {
      const scaleBy = direction === "in" ? ZOOM_FACTOR : 1 / ZOOM_FACTOR;
      const stage = stageRef.current;
      if (!stage) return;

      const oldScale = stageScale;

      // When zooming with buttons (no pointer), use stage center as the focal point
      const pointerPos = pointer || {
        x: stage.width() / 2,
        y: stage.height() / 2,
      };

      const mousePointTo = {
        x: (pointerPos.x - stage.x()) / oldScale,
        y: (pointerPos.y - stage.y()) / oldScale,
      };

      const newScale = Math.max(
        MIN_SCALE,
        Math.min(oldScale * scaleBy, MAX_SCALE)
      );

      setStageScale(newScale);
      setStagePosition({
        x: pointerPos.x - mousePointTo.x * newScale,
        y: pointerPos.y - mousePointTo.y * newScale,
      });
    },
    [stageRef, stageScale]
  );

  /**
   * Handle wheel events for zooming
   * @param {Object} e - The wheel event from Konva
   */
  const handleWheel = useCallback(
    (e) => {
      e.evt.preventDefault();
      const direction = e.evt.deltaY > 0 ? "out" : "in";
      const pointer = stageRef.current?.getPointerPosition();
      handleZoom(direction, pointer);
    },
    [handleZoom, stageRef]
  );

  /**
   * Handle zoom in button click
   */
  const handleZoomIn = useCallback(() => {
    handleZoom("in");
  }, [handleZoom]);

  /**
   * Handle zoom out button click
   */
  const handleZoomOut = useCallback(() => {
    handleZoom("out");
  }, [handleZoom]);

  /**
   * Zoom to fit all content in view
   * @param {Array} elements - Array of elements to fit in view (must have x, y, width, height)
   */
  const handleZoomToFit = useCallback(
    (elements) => {
      if (!stageRef.current || !elements || elements.length === 0) return;

      // Calculate bounding box of all elements
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      elements.forEach((el) => {
        if (!el) return;

        const x1 = el.x;
        const y1 = el.y;
        const x2 = el.x + (el.width || 0);
        const y2 = el.y + (el.height || el.fontSize || 0);

        minX = Math.min(minX, x1);
        minY = Math.min(minY, y1);
        maxX = Math.max(maxX, x2);
        maxY = Math.max(maxY, y2);
      });

      if (minX === Infinity) return; // Nothing to zoom to

      const padding = 40;
      const stage = stageRef.current;
      const stageWidth = stage.width();
      const stageHeight = stage.height();

      const contentWidth = maxX - minX + padding * 2;
      const contentHeight = maxY - minY + padding * 2;

      // Calculate scale to fit content
      const scaleX = stageWidth / contentWidth;
      const scaleY = stageHeight / contentHeight;
      const scale = Math.min(scaleX, scaleY);
      const newScale = Math.max(MIN_SCALE, Math.min(scale, MAX_SCALE));

      setStageScale(newScale);

      // Calculate new position to center content
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      setStagePosition({
        x: stageWidth / 2 - centerX * newScale,
        y: stageHeight / 2 - centerY * newScale,
      });
    },
    [stageRef]
  );

  /**
   * Handle stage mouse events for dragging
   */
  const handleStageMouseDown = useCallback((e) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    
    // Allow dragging when:
    // 1. Clicked on empty space AND
    // 2. Either activeTool is "pan" (spacebar held) OR activeTool is null/undefined (normal mode)
    if (!clickedOnEmpty || (activeTool !== "pan" && activeTool !== null && activeTool !== undefined)) {
      return;
    }

    // Change cursor to grabbing when starting to drag the canvas
    const stage = e.target.getStage();
    stage.container().style.cursor = "grabbing";

    setIsDragging(true);
    setLastPointerPosition(e.target.getStage().getPointerPosition());
  }, [activeTool]);

  const handleStageMouseMove = useCallback(
    (e) => {
      // Allow dragging when:
      // 1. isDragging is true AND
      // 2. Either activeTool is "pan" (spacebar held) OR activeTool is null/undefined (normal mode)
      if (!isDragging || (activeTool !== "pan" && activeTool !== null && activeTool !== undefined)) return;

      const stage = e.target.getStage();
      const currentPointerPosition = stage.getPointerPosition();
      if (!currentPointerPosition || !lastPointerPosition) return;

      const deltaX = currentPointerPosition.x - lastPointerPosition.x;
      const deltaY = currentPointerPosition.y - lastPointerPosition.y;

      setStagePosition((prev) => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY,
      }));

      setLastPointerPosition(currentPointerPosition);
    },
    [isDragging, lastPointerPosition, activeTool]
  );

  const handleStageMouseUp = useCallback((e) => {
    if (isDragging) {
      // Restore cursor to grab when finished dragging the canvas
      const stage = e?.target?.getStage();
      if (stage) {
        stage.container().style.cursor = "grab";
      }
    }
    
    setIsDragging(false);
    setLastPointerPosition(null);
  }, [isDragging]);

  return {
    // State
    stageScale,
    stagePosition,
    zoomPercentage,
    isDragging,

    // Actions
    setStageScale,
    setStagePosition,

    // Handlers
    handleZoom,
    handleZoomIn,
    handleZoomOut,
    handleZoomToFit,
    handleWheel,
    handleStageMouseDown,
    handleStageMouseMove,
    handleStageMouseUp,

    // Constants for external use
    MIN_SCALE,
    MAX_SCALE,
    ZOOM_FACTOR,
  };
};

export default useCanvasNavigation;
