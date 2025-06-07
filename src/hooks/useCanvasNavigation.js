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
 * @returns {Object} Canvas navigation state and handlers
 */
const useCanvasNavigation = ({
  stageRef,
  initialScale = 1,
  initialPosition = { x: 0, y: 0 },
}) => {
  // State for canvas transformation
  const [stageScale, setStageScale] = useState(initialScale);
  const [stagePosition, setStagePosition] = useState(initialPosition);

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
      const stage = stageRef.current;
      if (!stage) return;

      const scaleBy = direction === "in" ? ZOOM_FACTOR : 1 / ZOOM_FACTOR;
      const oldScale = stageScale;
      const newScale = Math.max(
        MIN_SCALE,
        Math.min(oldScale * scaleBy, MAX_SCALE)
      );

      // If no pointer provided, use the center of the current viewport (same logic as photo upload)
      const pointerPos = pointer || {
        x: stage.width() / 2,
        y: stage.height() / 2,
      };

      // Calculate the point in the canvas coordinate system that corresponds to the pointer position
      const mousePointTo = {
        x: (pointerPos.x - stagePosition.x) / oldScale,
        y: (pointerPos.y - stagePosition.y) / oldScale,
      };

      // Calculate new position to keep the mousePointTo at the same screen position
      const newPosition = {
        x: pointerPos.x - mousePointTo.x * newScale,
        y: pointerPos.y - mousePointTo.y * newScale,
      };

      setStageScale(newScale);
      setStagePosition(newPosition);
    },
    [stageRef, stageScale, stagePosition]
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
   * Handle stage drag end for panning
   * This uses React/Konva's built-in draggable system instead of raw mouse events
   */
  const handleStageDragEnd = useCallback((e) => {
    const stage = e.target;
    console.log(
      "🖱️ handleStageDragEnd called - panning completed via draggable"
    );

    // Update our position state to match the stage's new position
    setStagePosition({
      x: stage.x(),
      y: stage.y(),
    });
  }, []);

  /**
   * Check if the target is the Stage itself (empty space) for conditional dragging
   * This helps determine when canvas panning should be enabled
   */
  const isStageTarget = useCallback((e) => {
    const isStage = e.target === e.target.getStage();
    console.log("🎯 isStageTarget check:", {
      isStage,
      targetName: e.target.getClassName(),
      stageName: e.target.getStage().getClassName(),
    });
    return isStage;
  }, []);

  /**
   * Handle stage drag start - only allow dragging when clicking on empty space
   * This prevents canvas panning when clicking on elements
   */
  const handleStageDragStart = useCallback(
    (e) => {
      console.log("🖱️ Stage drag start event triggered");
      // Only allow dragging if clicking on the Stage itself (empty space), not on elements
      if (!isStageTarget(e)) {
        // Prevent dragging by canceling the event
        console.log("🚫 Stage drag blocked - not clicking on Stage");
        e.target.stopDrag();
        return;
      }
      console.log("🖱️ Stage drag started on empty space - panning should work");
    },
    [isStageTarget]
  );

  return {
    // State
    stageScale,
    stagePosition,
    zoomPercentage,

    // Actions
    setStageScale,
    setStagePosition,

    // Handlers
    handleZoom,
    handleZoomIn,
    handleZoomOut,
    handleZoomToFit,
    handleWheel,
    handleStageDragEnd,
    handleStageDragStart,
    isStageTarget,

    // Constants for external use
    MIN_SCALE,
    MAX_SCALE,
    ZOOM_FACTOR,
  };
};

export default useCanvasNavigation;
