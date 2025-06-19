import PropTypes from "prop-types";
import { Box } from "@chakra-ui/react";
import { UniversalControlBar } from "./UniversalControlBar.jsx";
import { TOOLBAR_CONFIG } from "./toolbarConfig";
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
 */
export const ElementToolbar = ({
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

  if (!elementId) {
    return null;
  }

  if (!isSelected) {
    return null;
  }

  // Calculate toolbar position - zoom-independent, viewport-constrained
  const getToolbarPosition = () => {
    if (DEBUG_TOOLBAR) {
      console.log("🎯 getToolbarPosition called - element dimensions:", {
        width: element?.width,
        height: element?.height,
        x: element?.x,
        y: element?.y,
      });
    }

    if (!stageRef?.current || !element) {
      return { top: 100, left: 100 };
    }

    const stage = stageRef.current;
    const node = stage.findOne("#" + elementId);

    if (!node) {
      const allNodes = [];
      stage.find("*").forEach((n) => {
        if (n.id()) {
          allNodes.push({ id: n.id(), className: n.getClassName() });
        }
      });

      // Fallback calculation using stage transform
      const stageContainer = stage.container().getBoundingClientRect();
      const stageScale = stage.scaleX();
      const stagePos = { x: stage.x(), y: stage.y() };

      const estimatedX =
        element.x * stageScale + stagePos.x + stageContainer.left;
      const estimatedY =
        element.y * stageScale + stagePos.y + stageContainer.top;

      if (DEBUG_TOOLBAR) {
        console.log("🎯 Using fallback position calculation:");
        console.log("🎯 Stage container rect:", stageContainer);
        console.log("🎯 Stage scale:", stageScale);
        console.log("🎯 Stage position:", stagePos);
        console.log("🎯 Element logical position:", {
          x: element.x,
          y: element.y,
        });
        console.log("🎯 Calculated screen position:", {
          x: estimatedX,
          y: estimatedY,
        });
      }
      const toolbarHeight = APP_CONFIG.UI.TOOLBAR.HEIGHT;
      const clearanceAbove = APP_CONFIG.UI.TOOLBAR.CLEARANCE_ABOVE;

      return {
        top: estimatedY - toolbarHeight - clearanceAbove,
        left: estimatedX,
      };
    }

    // Node found - use getClientRect()
    const stageContainer = stage.container().getBoundingClientRect();
    const nodeClientRect = node.getClientRect();

    if (DEBUG_TOOLBAR) {
      console.log("🎯 Node found! Using getClientRect():");
      console.log("🎯 Stage container rect:", stageContainer);
      console.log("🎯 Node client rect:", nodeClientRect);
    }

    const elementScreenX = nodeClientRect.x + stageContainer.left;
    const elementScreenY = nodeClientRect.y + stageContainer.top;
    const elementScreenWidth = element.width;
    const elementScreenHeight = element.height;

    if (DEBUG_TOOLBAR) {
      console.log("🎯 Final screen coordinates:", {
        x: elementScreenX,
        y: elementScreenY,
        width: elementScreenWidth,
        height: elementScreenHeight,
      });
    }

    // Toolbar positioning logic (simplified for debugging)
    const toolbarWidth = APP_CONFIG.UI.TOOLBAR.WIDTH;
    const toolbarHeight = APP_CONFIG.UI.TOOLBAR.HEIGHT;
    const clearanceAbove = APP_CONFIG.UI.TOOLBAR.CLEARANCE_ABOVE;
    const margin = APP_CONFIG.UI.TOOLBAR.MARGIN;

    let preferredLeft =
      elementScreenX + elementScreenWidth / 2 - toolbarWidth / 2;
    let preferredTop = elementScreenY - toolbarHeight - clearanceAbove;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

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

  // Determine mode and controls
  const mode = isEditing ? "edit" : "select";
  const controls = TOOLBAR_CONFIG[mode]?.[element.type] || [];

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
  return (() => {
    if (DEBUG_TOOLBAR) {
      console.log(
        `🔄 ElementToolar render: Element W=${element?.width} H=${element?.height}, Position: (${element?.x}, ${element?.y}), Mode: ${mode}, Controls: ${controls.length}`
      );
    }
    return (
      <Box
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
        minWidth="280px"
        maxWidth="320px"
        onClick={(e) => {
          // Prevent clicks on toolbar from bubbling up to stage or document
          e.stopPropagation();
        }}
        onMouseDown={(e) => {
          // Prevent mousedown events from bubbling up
          e.stopPropagation();
        }}
      >
        <UniversalControlBar
          controls={controls}
          controlProps={controlProps}
          controlRegistry={CONTROL_REGISTRY}
        />
      </Box>
    );
  })();
};

ElementToolbar.propTypes = {
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
