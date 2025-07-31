import { useRef, useLayoutEffect, useState, useMemo } from "react";
import PropTypes from "prop-types";
import { Box } from "@chakra-ui/react";
import { ElementToolbarControlsBar } from "./ElementToolbarControlsBar.jsx";
import { TOOLBAR_CONFIG } from "./toolbarConfig.js";
import { CONTROL_REGISTRY } from "./controls/index.js";
import { APP_CONFIG } from "../../../config/appConfig.js";
// Debug flag - set to true when debugging toolbar positioning
const DEBUG_TOOLBAR = false;

/**
 * ElementToolbar - Master toolbar container that manages the two-tier architecture
 *
 * Handles:
 * - State management between selected and editing modes
 * - Positioning logic that works for all element types
 * - Consistent appearance and behavior across element types
 *
 * ElementToolbarRenderer
 *   └── ElementToolbarControlsBar
 *         └── ElementToolbarControls (FontSizeControl, ColorControl, etc.)
 */

export const ElementToolbarRenderer = ({
  updateElementId,
  element,
  isSelected,
  isEditing,
  onEdit,
  onDelete,
  onUpdate,
  stageRef,
  // Add these as optional props for future extensibility
  onCopy,
  onBringForward,
  onSendBackward,
  onBringToFront,
  onSendToBack,
}) => {
  const elementId = updateElementId || element?.id;
  // No-op handlers for controls if not provided
  const noop = () => {};
  onCopy = typeof onCopy === "function" ? onCopy : noop;
  onBringForward = typeof onBringForward === "function" ? onBringForward : noop;
  onSendBackward = typeof onSendBackward === "function" ? onSendBackward : noop;
  onBringToFront = typeof onBringToFront === "function" ? onBringToFront : noop;
  onSendToBack = typeof onSendToBack === "function" ? onSendToBack : noop;

  // Ref and state for measuring toolbar width
  const toolbarRef = useRef(null);
  const [measuredWidth, setMeasuredWidth] = useState(
    APP_CONFIG.UI.TOOLBAR.WIDTH
  );

  // Determine mode and controls
  const mode = isEditing ? "edit" : "select";
  const controls = useMemo(
    () => TOOLBAR_CONFIG[mode]?.[element.type] || [],
    [mode, element.type]
  );

  // Compose controlProps for all controls
  const controlProps = {
    element,
    onUpdate,
    onDelete,
    onEdit,
    onCopy,
    onBringForward,
    onSendBackward,
    onBringToFront,
    onSendToBack,
  };

  // Measure toolbar width after render and when controls change
  useLayoutEffect(() => {
    if (toolbarRef.current) {
      setMeasuredWidth(toolbarRef.current.offsetWidth);
    }
  }, [controls, isEditing]);

  if (!elementId) {
    return null;
  }

  if (!isSelected) {
    return null;
  }

  // Calculate toolbar position - zoom-independent, viewport-constrained
  const getToolbarPosition = () => {
    const toolbarWidth = measuredWidth || APP_CONFIG.UI.TOOLBAR.WIDTH;
    const toolbarHeight = APP_CONFIG.UI.TOOLBAR.HEIGHT;
    const clearanceAbove = APP_CONFIG.UI.TOOLBAR.CLEARANCE_ABOVE;
    const margin = APP_CONFIG.UI.TOOLBAR.MARGIN;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    if (!stageRef?.current || !element) {
      return { top: 100, left: 100 };
    }
    const stage = stageRef.current;
    const node = stage.findOne("#" + elementId);
    // Fallback calculation if node is not found or not ready
    if (!node) {
      const stageContainer = stage.container().getBoundingClientRect();
      const stageScale = stage.scaleX();
      const stagePos = { x: stage.x(), y: stage.y() };
      let estimatedX =
        element.x * stageScale + stagePos.x + stageContainer.left;
      let estimatedY = element.y * stageScale + stagePos.y + stageContainer.top;
      if (DEBUG_TOOLBAR) {
        console.log("[TOOLBAR FALLBACK] stageScale:", stageScale);
        console.log(
          "[TOOLBAR FALLBACK] element.x:",
          element.x,
          "element.width:",
          element.width
        );
        console.log(
          "[TOOLBAR FALLBACK] estimatedX:",
          estimatedX,
          "estimatedY:",
          estimatedY
        );
      }
      if (!isFinite(estimatedX) || !isFinite(estimatedY)) {
        estimatedX = margin;
        estimatedY = margin;
      }
      let left =
        estimatedX + (element.width * stageScale) / 2 - toolbarWidth / 2;
      let top = estimatedY - toolbarHeight - clearanceAbove;
      if (DEBUG_TOOLBAR) {
        console.log("[TOOLBAR FALLBACK] left:", left, "top:", top);
      }
      left = Math.max(
        margin,
        Math.min(left, viewportWidth - toolbarWidth - margin)
      );
      if (top < margin) {
        top = estimatedY + element.height * stageScale + margin;
        if (top + toolbarHeight > viewportHeight - margin) {
          top = margin;
        }
      }
      if (!isFinite(left) || !isFinite(top)) {
        left = margin;
        top = margin;
      }
      return { top, left };
    }
    // Node found - use getClientRect()
    const stageContainer = stage.container().getBoundingClientRect();
    const nodeClientRect = node.getClientRect();
    const stageScale = stage.scaleX();
    const elementScreenX = nodeClientRect.x + stageContainer.left;
    const elementScreenY = nodeClientRect.y + stageContainer.top;
    const elementScreenWidth = element.width * stageScale;
    const elementScreenHeight = element.height * stageScale;
    let preferredLeft =
      elementScreenX + elementScreenWidth / 2 - toolbarWidth / 2;
    let preferredTop = elementScreenY - toolbarHeight - clearanceAbove;
    if (DEBUG_TOOLBAR) {
      console.log("[TOOLBAR NODE] stageScale:", stageScale);
      console.log(
        "[TOOLBAR NODE] elementScreenX:",
        elementScreenX,
        "elementScreenWidth:",
        elementScreenWidth
      );
      console.log(
        "[TOOLBAR NODE] preferredLeft:",
        preferredLeft,
        "preferredTop:",
        preferredTop
      );
    }
    const constrainedLeft = Math.max(
      margin,
      Math.min(preferredLeft, viewportWidth - toolbarWidth - margin)
    );
    let constrainedTop = preferredTop;
    if (preferredTop < margin) {
      constrainedTop = elementScreenY + elementScreenHeight + margin;
      if (constrainedTop + toolbarHeight > viewportHeight - margin) {
        constrainedTop = margin;
      }
    }
    const finalPosition = {
      top: constrainedTop,
      left: constrainedLeft,
    };
    return finalPosition;
  };

  const toolbarPosition = getToolbarPosition();
  if (DEBUG_TOOLBAR) {
    console.log("🎯 Toolbar will render at position:", toolbarPosition);
    console.log("🎯 ===== ElementToolbar RENDER END =====");
  }

  return (
    <Box
      ref={toolbarRef}
      position="fixed" // Fixed to viewport, not affected by canvas zoom
      top={`${toolbarPosition.top}px`}
      left={`${toolbarPosition.left}px`}
      zIndex={1000}
      bg="white"
      boxShadow="lg"
      borderRadius="md"
      border="1px solid"
      borderColor="gray.200"
      p={2}
      opacity={0.95}
      backdropFilter="blur(4px)"
      width="auto"
      // Remove minWidth/maxWidth so toolbar fits controls
      onClick={(e) => {
        // Prevent clicks on toolbar from bubbling up to stage or document
        e.stopPropagation();
      }}
      onMouseDown={(e) => {
        // Prevent mousedown events from bubbling up
        e.stopPropagation();
      }}
    >
      <ElementToolbarControlsBar
        controls={controls}
        controlProps={controlProps}
        controlRegistry={CONTROL_REGISTRY}
      />
    </Box>
  );
};

ElementToolbarRenderer.propTypes = {
  updateElementId: PropTypes.string,
  element: PropTypes.shape({
    id: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
    width: PropTypes.number,
    height: PropTypes.number,
  }).isRequired,
  isSelected: PropTypes.bool.isRequired,
  isEditing: PropTypes.bool.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onUpdate: PropTypes.func,
  stageRef: PropTypes.object,
  onCopy: PropTypes.func,
  onBringForward: PropTypes.func,
  onSendBackward: PropTypes.func,
  onBringToFront: PropTypes.func,
  onSendToBack: PropTypes.func,
};
