import PropTypes from "prop-types";
import { Box } from "@chakra-ui/react";
import { SelectedToolbar } from "./SelectedToolbar.jsx";
import { EditingToolbar } from "./EditingToolbar.jsx";

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
}) => {
  // Don't render if element is not selected
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

    // Get stage container position in the viewport
    const stageContainer = stage.container().getBoundingClientRect();

    // For rotated elements, we need to calculate the bounding box
    // Use the client rect to get the actual visual bounds regardless of rotation
    const nodeClientRect = node.getClientRect();

    // getClientRect() already returns coordinates relative to the stage container
    // We just need to offset by the stage container's position in the viewport
    const elementScreenX = nodeClientRect.x + stageContainer.left;
    const elementScreenY = nodeClientRect.y + stageContainer.top;
    const elementScreenWidth = nodeClientRect.width;
    const elementScreenHeight = nodeClientRect.height;

    // Toolbar configuration (zoom-independent sizes)
    const toolbarWidth = 300;
    const toolbarHeight = 50;
    const margin = 20;
    const clearanceAbove = isEditing ? 60 : 80; // Less clearance in editing mode

    // Calculate preferred position (above element, centered)
    let preferredLeft =
      elementScreenX + elementScreenWidth / 2 - toolbarWidth / 2;
    let preferredTop = elementScreenY - toolbarHeight - clearanceAbove;

    // Viewport constraints
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Constrain horizontal position
    const constrainedLeft = Math.max(
      margin,
      Math.min(preferredLeft, viewportWidth - toolbarWidth - margin)
    );

    // Constrain vertical position with fallback to below element
    let constrainedTop = preferredTop;
    if (preferredTop < margin) {
      // If no space above, position below element
      constrainedTop = elementScreenY + elementScreenHeight + margin;

      // If still no space below, position at top of viewport
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
      {isEditing ? (
        <EditingToolbar
          element={element}
          onUpdate={onUpdate}
          onFinishEditing={() => onEdit(false)}
        />
      ) : (
        <SelectedToolbar
          element={element}
          onEdit={() => onEdit(true)}
          onDelete={onDelete}
        />
      )}
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
};
