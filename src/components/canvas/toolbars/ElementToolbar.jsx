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
  stageBox,
}) => {
  // Don't render if element is not selected
  if (!isSelected) {
    return null;
  }

  // Calculate toolbar position based on element and stage
  const getToolbarPosition = () => {
    if (!stageRef?.current || !element) {
      return { top: 0, left: 0 };
    }

    const stage = stageRef.current;
    const node = stage.findOne("#" + element.id);
    
    if (!node) {
      return { top: 0, left: 0 };
    }

    // Get the actual position and dimensions from the Konva node
    const nodePosition = node.getAbsolutePosition();
    const nodeWidth = node.width() || element.width || 100;

    // Convert node position to screen coordinates
    const scale = stage.scaleX();
    const stageRect = stageBox || stage.container().getBoundingClientRect();
    const screenX = nodePosition.x * scale + stageRect.left;
    const screenY = nodePosition.y * scale + stageRect.top;

    // Position toolbar above the element with appropriate clearance
    const toolbarHeight = 60; // Estimated toolbar height
    const clearance = isEditing ? 80 : 120; // More clearance for selected mode (transformer handles)
    
    const newTop = screenY - toolbarHeight - clearance;
    const newLeft = screenX + (nodeWidth * scale) / 2; // Center horizontally on the element

    return {
      top: Math.max(stageRect.top + 10, newTop), // Ensure it's not offscreen at top
      left: Math.max(
        stageRect.left + 100,
        Math.min(stageRect.right - 300, newLeft)
      ), // Keep within stage bounds with margins
    };
  };

  const toolbarPosition = getToolbarPosition();

  return (
    <Box
      position="absolute"
      top={`${toolbarPosition.top}px`}
      left={`${toolbarPosition.left}px`}
      transform="translateX(-50%)"
      zIndex={1000}
      bg="white"
      boxShadow="lg"
      borderRadius="md"
      border="1px solid"
      borderColor="gray.200"
      p={2}
      opacity={0.95}
      backdropFilter="blur(4px)"
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
  stageBox: PropTypes.object,
};
