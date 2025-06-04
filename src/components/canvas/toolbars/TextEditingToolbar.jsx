import PropTypes from "prop-types";
import {
  HStack,
  VStack,
  Select,
  IconButton,
  Tooltip,
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  SimpleGrid,
  Box,
} from "@chakra-ui/react";
import {
  MdFormatAlignLeft,
  MdFormatAlignCenter,
  MdFormatAlignRight,
  MdFormatColorText,
  MdCheck,
} from "react-icons/md";
import {
  FaSquare,
  FaRegSquare,
  FaWindowRestore,
  FaCloudversify,
  FaComment,
} from "react-icons/fa";

/**
 * TextEditingToolbar - Editing controls for text elements
 *
 * Provides comprehensive text formatting controls when element is in editing mode
 */
export const TextEditingToolbar = ({ element, onUpdate, onFinishEditing }) => {
  // Font families
  const fontFamilies = [
    { name: "Arial", type: "Sans-serif" },
    { name: "Georgia", type: "Serif" },
    { name: "Comic Sans MS", type: "Handwritten" },
    { name: "Verdana", type: "Sans-serif" },
    { name: "Times New Roman", type: "Serif" },
  ];

  // Font sizes
  const fontSizes = [8, 12, 14, 16, 18, 20, 24, 30, 36, 48, 60, 72];

  // Text colors
  const colors = [
    "#000000", // Black
    "#FFFFFF", // White
    "#FF0000", // Red
    "#00FF00", // Green
    "#0000FF", // Blue
    "#FFFF00", // Yellow
    "#FF00FF", // Magenta
    "#00FFFF", // Cyan
  ];

  // Background shapes
  const backgroundShapes = [
    { id: "none", name: "None", icon: <FaRegSquare /> },
    { id: "rectangle", name: "Rectangle", icon: <FaSquare /> },
    { id: "rounded", name: "Rounded Rectangle", icon: <FaWindowRestore /> },
    { id: "cloud", name: "Thought Cloud", icon: <FaCloudversify /> },
    { id: "speech", name: "Speech Bubble", icon: <FaComment /> },
  ];

  // Handler for updating text properties
  const handleUpdateProperty = (property, value) => {
    onUpdate({
      ...element,
      [property]: value,
    });
  };

  return (
    <VStack spacing={2} align="stretch" minW="300px">
      {/* Primary Controls Row */}
      <HStack spacing={2}>
        {/* Font Family */}
        <Select
          size="sm"
          width="140px"
          value={element.fontFamily}
          onChange={(e) => handleUpdateProperty("fontFamily", e.target.value)}
        >
          {fontFamilies.map((font) => (
            <option key={font.name} value={font.name}>
              {font.name}
            </option>
          ))}
        </Select>

        {/* Font Size */}
        <Select
          size="sm"
          width="80px"
          value={element.fontSize}
          onChange={(e) =>
            handleUpdateProperty("fontSize", parseInt(e.target.value))
          }
        >
          {fontSizes.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </Select>

        {/* Text Color */}
        <Popover>
          <PopoverTrigger>
            <Tooltip label="Text Color" hasArrow>
              <IconButton
                icon={<MdFormatColorText />}
                size="sm"
                variant="outline"
                colorScheme="gray"
                style={{ color: element.fill }}
                aria-label="Text color"
              />
            </Tooltip>
          </PopoverTrigger>
          <PopoverContent width="200px">
            <PopoverBody>
              <SimpleGrid columns={4} spacing={2}>
                {colors.map((color) => (
                  <Box
                    key={color}
                    width="30px"
                    height="30px"
                    bg={color}
                    border="2px solid"
                    borderColor={
                      element.fill === color ? "blue.500" : "gray.300"
                    }
                    borderRadius="md"
                    cursor="pointer"
                    onClick={() => handleUpdateProperty("fill", color)}
                  />
                ))}
              </SimpleGrid>
            </PopoverBody>
          </PopoverContent>
        </Popover>

        {/* Done Button */}
        <Button
          leftIcon={<MdCheck />}
          size="sm"
          colorScheme="green"
          onClick={onFinishEditing}
        >
          Done
        </Button>
      </HStack>

      {/* Secondary Controls Row */}
      <HStack spacing={2}>
        {/* Text Alignment */}
        <HStack spacing={1}>
          <Tooltip label="Align Left" hasArrow>
            <IconButton
              icon={<MdFormatAlignLeft />}
              size="sm"
              variant={element.align === "left" ? "solid" : "ghost"}
              colorScheme="gray"
              onClick={() => handleUpdateProperty("align", "left")}
              aria-label="Align left"
            />
          </Tooltip>
          <Tooltip label="Align Center" hasArrow>
            <IconButton
              icon={<MdFormatAlignCenter />}
              size="sm"
              variant={element.align === "center" ? "solid" : "ghost"}
              colorScheme="gray"
              onClick={() => handleUpdateProperty("align", "center")}
              aria-label="Align center"
            />
          </Tooltip>
          <Tooltip label="Align Right" hasArrow>
            <IconButton
              icon={<MdFormatAlignRight />}
              size="sm"
              variant={element.align === "right" ? "solid" : "ghost"}
              colorScheme="gray"
              onClick={() => handleUpdateProperty("align", "right")}
              aria-label="Align right"
            />
          </Tooltip>
        </HStack>

        {/* Background Shape */}
        <Popover>
          <PopoverTrigger>
            <Tooltip label="Background Shape" hasArrow>
              <IconButton
                icon={
                  backgroundShapes.find(
                    (shape) => shape.id === element.backgroundShape
                  )?.icon || <FaRegSquare />
                }
                size="sm"
                variant="outline"
                colorScheme="gray"
                aria-label="Background shape"
              />
            </Tooltip>
          </PopoverTrigger>
          <PopoverContent width="200px">
            <PopoverBody>
              <VStack spacing={1}>
                {backgroundShapes.map((shape) => (
                  <Button
                    key={shape.id}
                    leftIcon={shape.icon}
                    size="sm"
                    variant={
                      element.backgroundShape === shape.id ? "solid" : "ghost"
                    }
                    width="100%"
                    justifyContent="flex-start"
                    onClick={() =>
                      handleUpdateProperty("backgroundShape", shape.id)
                    }
                  >
                    {shape.name}
                  </Button>
                ))}
              </VStack>
            </PopoverBody>
          </PopoverContent>
        </Popover>
      </HStack>
    </VStack>
  );
};

TextEditingToolbar.propTypes = {
  element: PropTypes.shape({
    fontFamily: PropTypes.string.isRequired,
    fontSize: PropTypes.number.isRequired,
    fill: PropTypes.string.isRequired,
    align: PropTypes.string,
    backgroundShape: PropTypes.string,
  }).isRequired,
  onUpdate: PropTypes.func.isRequired,
  onFinishEditing: PropTypes.func.isRequired,
};
