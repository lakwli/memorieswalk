// Registry of all stateless, element-agnostic controls for UniversalToolbar
import { Button, IconButton, Slider, Tooltip } from "@chakra-ui/react";
import {
  MdFormatBold,
  MdFormatAlignLeft,
  MdDelete,
  MdMoreVert,
  MdContentCopy,
  MdFormatColorText,
  MdCheck,
} from "react-icons/md";
import { FaLayerGroup } from "react-icons/fa";
import PropTypes from "prop-types";

export const FontStyleControl = ({ element, onUpdate }) => (
  <Tooltip label="Font Style" hasArrow>
    <IconButton
      icon={<MdFormatBold />}
      size="sm"
      aria-label="Font Style"
      onClick={() =>
        onUpdate({
          fontStyle: element.fontStyle === "bold" ? "normal" : "bold",
        })
      }
    />
  </Tooltip>
);
FontStyleControl.propTypes = {
  element: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

// Font Family Control
export const FontFamilyControl = ({ element, onUpdate }) => (
  <Tooltip label="Font Family" hasArrow>
    <select
      value={element.fontFamily || ""}
      onChange={(e) => onUpdate({ fontFamily: e.target.value })}
      style={{ fontSize: "0.9em", padding: "2px 6px", borderRadius: 4 }}
    >
      <option value="Arial">Arial</option>
      <option value="Georgia">Georgia</option>
      <option value="Comic Sans MS">Comic Sans MS</option>
      <option value="Verdana">Verdana</option>
      <option value="Times New Roman">Times New Roman</option>
    </select>
  </Tooltip>
);
FontFamilyControl.propTypes = {
  element: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

// Font Size Control
export const FontSizeControl = ({ element, onUpdate }) => (
  <Tooltip label="Font Size" hasArrow>
    <select
      value={element.fontSize || 16}
      onChange={(e) => onUpdate({ fontSize: parseInt(e.target.value) })}
      style={{ fontSize: "0.9em", padding: "2px 6px", borderRadius: 4 }}
    >
      {[8, 12, 14, 16, 18, 20, 24, 30, 36, 48, 60, 72].map((size) => (
        <option key={size} value={size}>
          {size}
        </option>
      ))}
    </select>
  </Tooltip>
);
FontSizeControl.propTypes = {
  element: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

// Text Color Control
export const TextColorControl = ({ element, onUpdate }) => (
  <Tooltip label="Text Color" hasArrow>
    <IconButton
      icon={<MdFormatColorText />}
      size="sm"
      aria-label="Text Color"
      style={{ color: element.fill || "#000" }}
      onClick={() =>
        onUpdate({ fill: element.fill === "#000" ? "#f00" : "#000" })
      }
    />
  </Tooltip>
);
TextColorControl.propTypes = {
  element: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

// Alignment Controls
export const AlignLeftControl = ({ element, onUpdate }) => (
  <Tooltip label="Align Left" hasArrow>
    <IconButton
      icon={<MdFormatAlignLeft />}
      size="sm"
      aria-label="Align Left"
      colorScheme={element.align === "left" ? "blue" : "gray"}
      onClick={() => onUpdate({ align: "left" })}
    />
  </Tooltip>
);
AlignLeftControl.propTypes = {
  element: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
};
export const AlignCenterControl = ({ element, onUpdate }) => (
  <Tooltip label="Align Center" hasArrow>
    <IconButton
      icon={<MdFormatAlignLeft style={{ transform: "rotate(90deg)" }} />}
      size="sm"
      aria-label="Align Center"
      colorScheme={element.align === "center" ? "blue" : "gray"}
      onClick={() => onUpdate({ align: "center" })}
    />
  </Tooltip>
);
AlignCenterControl.propTypes = {
  element: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
};
export const AlignRightControl = ({ element, onUpdate }) => (
  <Tooltip label="Align Right" hasArrow>
    <IconButton
      icon={<MdFormatAlignLeft style={{ transform: "rotate(180deg)" }} />}
      size="sm"
      aria-label="Align Right"
      colorScheme={element.align === "right" ? "blue" : "gray"}
      onClick={() => onUpdate({ align: "right" })}
    />
  </Tooltip>
);
AlignRightControl.propTypes = {
  element: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

// Background Shape Control
export const BackgroundShapeControl = ({ element, onUpdate }) => (
  <Tooltip label="Background Shape" hasArrow>
    <select
      value={element.backgroundShape || "none"}
      onChange={(e) => onUpdate({ backgroundShape: e.target.value })}
      style={{ fontSize: "0.9em", padding: "2px 6px", borderRadius: 4 }}
    >
      <option value="none">None</option>
      <option value="rectangle">Rectangle</option>
      <option value="rounded">Rounded Rectangle</option>
      <option value="cloud">Thought Cloud</option>
      <option value="speech">Speech Bubble</option>
    </select>
  </Tooltip>
);
BackgroundShapeControl.propTypes = {
  element: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

// Brightness Control
export const BrightnessControl = ({ element, onUpdate }) => (
  <Tooltip label="Brightness" hasArrow>
    <Slider
      min={0}
      max={2}
      step={0.1}
      value={element.brightness || 1}
      onChange={(val) => onUpdate({ brightness: val })}
      width="60px"
      size="sm"
    />
  </Tooltip>
);
BrightnessControl.propTypes = {
  element: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

// Contrast Control
export const ContrastControl = ({ element, onUpdate }) => (
  <Tooltip label="Contrast" hasArrow>
    <Slider
      min={0}
      max={2}
      step={0.1}
      value={element.contrast || 1}
      onChange={(val) => onUpdate({ contrast: val })}
      width="60px"
      size="sm"
    />
  </Tooltip>
);
ContrastControl.propTypes = {
  element: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

// Stroke Width Control
export const StrokeWidthControl = ({ element, onUpdate }) => (
  <Tooltip label="Stroke Width" hasArrow>
    <Slider
      min={1}
      max={20}
      step={1}
      value={element.strokeWidth || 2}
      onChange={(val) => onUpdate({ strokeWidth: val })}
      width="60px"
      size="sm"
    />
  </Tooltip>
);
StrokeWidthControl.propTypes = {
  element: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

// Stroke Color Control
export const StrokeColorControl = ({ element, onUpdate }) => (
  <Tooltip label="Stroke Color" hasArrow>
    <IconButton
      icon={<MdFormatColorText />}
      size="sm"
      aria-label="Stroke Color"
      style={{ color: element.stroke || "#000" }}
      onClick={() =>
        onUpdate({ stroke: element.stroke === "#000" ? "#f00" : "#000" })
      }
    />
  </Tooltip>
);
StrokeColorControl.propTypes = {
  element: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

// Edit Control
export const EditControl = ({ onEdit }) => (
  <Tooltip label="Edit" hasArrow>
    <IconButton
      icon={<MdCheck />}
      size="sm"
      colorScheme="blue"
      aria-label="Edit"
      onClick={onEdit}
    />
  </Tooltip>
);
EditControl.propTypes = {
  onEdit: PropTypes.func.isRequired,
};

// Copy Control
export const CopyControl = ({ onCopy }) => (
  <Tooltip label="Copy" hasArrow>
    <IconButton
      icon={<MdContentCopy />}
      size="sm"
      variant="ghost"
      onClick={onCopy}
      aria-label="Copy element"
    />
  </Tooltip>
);
CopyControl.propTypes = {
  onCopy: PropTypes.func.isRequired,
};

// Layer Controls (as a Menu)
import { Menu, MenuButton, MenuList, MenuItem } from "@chakra-ui/react";
export const LayerControl = ({
  onBringForward,
  onSendBackward,
  onBringToFront,
  onSendToBack,
}) => (
  <Menu size="sm">
    <Tooltip label="Layer Controls" hasArrow placement="top">
      <MenuButton
        as={IconButton}
        icon={<FaLayerGroup />}
        size="sm"
        variant="ghost"
        aria-label="Layer controls"
      />
    </Tooltip>
    <MenuList>
      <MenuItem onClick={onBringForward}>Bring Forward</MenuItem>
      <MenuItem onClick={onSendBackward}>Send Backward</MenuItem>
      <MenuItem onClick={onBringToFront}>Bring to Front</MenuItem>
      <MenuItem onClick={onSendToBack}>Send to Back</MenuItem>
    </MenuList>
  </Menu>
);
LayerControl.propTypes = {
  onBringForward: PropTypes.func.isRequired,
  onSendBackward: PropTypes.func.isRequired,
  onBringToFront: PropTypes.func.isRequired,
  onSendToBack: PropTypes.func.isRequired,
};

// Bring Forward Control
export const BringForwardControl = ({ onBringForward }) => (
  <Tooltip label="Bring Forward" hasArrow>
    <IconButton
      icon={<FaLayerGroup />}
      size="sm"
      variant="ghost"
      aria-label="Bring Forward"
      onClick={onBringForward}
    />
  </Tooltip>
);
BringForwardControl.propTypes = {
  onBringForward: PropTypes.func.isRequired,
};

// Send Backward Control
export const SendBackwardControl = ({ onSendBackward }) => (
  <Tooltip label="Send Backward" hasArrow>
    <IconButton
      icon={<FaLayerGroup style={{ transform: "scaleX(-1)" }} />}
      size="sm"
      variant="ghost"
      aria-label="Send Backward"
      onClick={onSendBackward}
    />
  </Tooltip>
);
SendBackwardControl.propTypes = {
  onSendBackward: PropTypes.func.isRequired,
};

// Bring To Front Control
export const BringToFrontControl = ({ onBringToFront }) => (
  <Tooltip label="Bring to Front" hasArrow>
    <IconButton
      icon={<FaLayerGroup style={{ color: "#3182ce" }} />}
      size="sm"
      variant="ghost"
      aria-label="Bring to Front"
      onClick={onBringToFront}
    />
  </Tooltip>
);
BringToFrontControl.propTypes = {
  onBringToFront: PropTypes.func.isRequired,
};

// Send To Back Control
export const SendToBackControl = ({ onSendToBack }) => (
  <Tooltip label="Send to Back" hasArrow>
    <IconButton
      icon={<FaLayerGroup style={{ color: "#718096" }} />}
      size="sm"
      variant="ghost"
      aria-label="Send to Back"
      onClick={onSendToBack}
    />
  </Tooltip>
);
SendToBackControl.propTypes = {
  onSendToBack: PropTypes.func.isRequired,
};

// Delete Control (in More Menu)
export const DeleteControl = ({ onDelete }) => (
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
        icon={<MdDelete color="#e53e3e" />} // Chakra's red.500
        onClick={onDelete}
        style={{ color: "#e53e3e" }}
      >
        Delete
      </MenuItem>
    </MenuList>
  </Menu>
);
DeleteControl.propTypes = {
  onDelete: PropTypes.func.isRequired,
};

// Done Control
export const DoneControl = ({ onDone }) => (
  <Button leftIcon={<MdCheck />} size="sm" colorScheme="green" onClick={onDone}>
    Done
  </Button>
);
DoneControl.propTypes = {
  onDone: PropTypes.func.isRequired,
};
