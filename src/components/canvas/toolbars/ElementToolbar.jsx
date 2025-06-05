import PropTypes from "prop-types";
import { Box } from "@chakra-ui/react";
import { UniversalControlBar } from "./UniversalControlBar.jsx";
import { TOOLBAR_CONFIG } from "./toolbarConfig";
import { CONTROL_REGISTRY } from "./controls/index.js";

/**
 * ElementToolbar - Master toolbar container that manages the two-tier architecture
 *
 * Handles:
 * - State management between selected and editing modes
 * - Positioning logic that works for all element types
 * - Consistent appearance and behavior across element types
 */
export const ElementToolbar = ({
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
  // No-op handlers for controls if not provided
  const noop = () => {};
  onCopy = typeof onCopy === "function" ? onCopy : noop;
  onBringForward = typeof onBringForward === "function" ? onBringForward : noop;
  onSendBackward = typeof onSendBackward === "function" ? onSendBackward : noop;
  onBringToFront = typeof onBringToFront === "function" ? onBringToFront : noop;
  onSendToBack = typeof onSendToBack === "function" ? onSendToBack : noop;

  if (!isSelected) {
    return null;
  }

  // Calculate toolbar position - zoom-independent, viewport-constrained
  const getToolbarPosition = () => {
    if (!stageRef?.current || !element) {
      return { top: 100, left: 100 };
    }

    const stage = stageRef.current;
    const node = stage.findOne("#" + element.id);

    if (!node) {
      return { top: 100, left: 100 };
    }

    const stageContainer = stage.container().getBoundingClientRect();
    const nodeClientRect = node.getClientRect();
    const elementScreenX = nodeClientRect.x + stageContainer.left;
    const elementScreenY = nodeClientRect.y + stageContainer.top;
    const elementScreenWidth = nodeClientRect.width;
    const elementScreenHeight = nodeClientRect.height;
    const toolbarWidth = 300;
    const toolbarHeight = 50;
    const margin = 20;
    const clearanceAbove = isEditing ? 60 : 80; // Less clearance in editing mode
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
    return {
      top: constrainedTop,
      left: constrainedLeft,
    };
  };

  const toolbarPosition = getToolbarPosition();

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
    >
      <UniversalControlBar
        controls={controls}
        controlProps={controlProps}
        controlRegistry={CONTROL_REGISTRY}
      />
    </Box>
  );
};

ElementToolbar.propTypes = {
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
