import PropTypes from "prop-types";
import { HStack, IconButton, Tooltip, Menu, MenuButton, MenuList, MenuItem } from "@chakra-ui/react";
import { MdEdit, MdMoreVert, MdDelete, MdContentCopy } from "react-icons/md";
import { FaLayerGroup } from "react-icons/fa";

/**
 * SelectedToolbar - Toolbar shown when element is selected (single-click)
 * 
 * Provides:
 * - Edit action (transitions to editing mode)
 * - Quick actions (copy, layer controls)
 * - More menu with delete and additional options
 */
export const SelectedToolbar = ({ element, onEdit, onDelete }) => {
  const handleCopy = () => {
    // TODO: Implement copy functionality
    console.log("Copy element:", element.id);
  };

  const handleBringForward = () => {
    // TODO: Implement layer management
    console.log("Bring forward:", element.id);
  };

  const handleSendBackward = () => {
    // TODO: Implement layer management
    console.log("Send backward:", element.id);
  };

  return (
    <HStack spacing={1}>
      {/* Edit Button - Primary action */}
      <Tooltip label="Edit" hasArrow placement="top">
        <IconButton
          icon={<MdEdit />}
          size="sm"
          variant="ghost"
          colorScheme="blue"
          onClick={onEdit}
          aria-label="Edit element"
        />
      </Tooltip>

      {/* Copy Button */}
      <Tooltip label="Copy" hasArrow placement="top">
        <IconButton
          icon={<MdContentCopy />}
          size="sm"
          variant="ghost"
          onClick={handleCopy}
          aria-label="Copy element"
        />
      </Tooltip>

      {/* Layer Controls */}
      <Tooltip label="Layer Controls" hasArrow placement="top">
        <Menu size="sm">
          <MenuButton
            as={IconButton}
            icon={<FaLayerGroup />}
            size="sm"
            variant="ghost"
            aria-label="Layer controls"
          />
          <MenuList>
            <MenuItem onClick={handleBringForward}>Bring Forward</MenuItem>
            <MenuItem onClick={handleSendBackward}>Send Backward</MenuItem>
            <MenuItem>Bring to Front</MenuItem>
            <MenuItem>Send to Back</MenuItem>
          </MenuList>
        </Menu>
      </Tooltip>

      {/* More Menu with Delete */}
      <Menu size="sm">
        <MenuButton
          as={IconButton}
          icon={<MdMoreVert />}
          size="sm"
          variant="ghost"
          aria-label="More options"
        />
        <MenuList>
          <MenuItem 
            icon={<MdDelete />}
            onClick={() => onDelete(element)}
            color="red.500"
          >
            Delete
          </MenuItem>
        </MenuList>
      </Menu>
    </HStack>
  );
};

SelectedToolbar.propTypes = {
  element: PropTypes.shape({
    id: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};
