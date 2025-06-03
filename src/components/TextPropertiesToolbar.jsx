import React from "react";
import {
  Box,
  HStack,
  VStack,
  Button,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tooltip,
  Divider,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Select,
} from "@chakra-ui/react";
import {
  MdFormatBold,
  MdFormatItalic,
  MdFormatUnderlined,
  MdFormatAlignLeft,
  MdFormatAlignCenter,
  MdFormatAlignRight,
  MdFormatColorText,
  MdBorderStyle,
} from "react-icons/md";
import { FaSquare, FaSquareFull } from "react-icons/fa";
import { BsFillChatLeftFill, BsCloudFill } from "react-icons/bs";

/**
 * TextPropertiesToolbar component
 * Provides a toolbar for editing text properties
 */
const TextPropertiesToolbar = ({
  element,
  onUpdateElement,
  position = { x: 0, y: 0 },
  isVisible = true,
}) => {
  if (!element || !isVisible) return null;

  // Define font families
  const fontFamilies = [
    { name: "Arial", type: "Sans-serif" },
    { name: "Georgia", type: "Serif" },
    { name: "Comic Sans MS", type: "Handwritten" },
    { name: "Verdana", type: "Sans-serif" },
    { name: "Times New Roman", type: "Serif" },
  ];

  // Define colors
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

  // Handle font family change
  const handleFontFamilyChange = (fontFamily) => {
    onUpdateElement({ fontFamily });
  };

  // Handle font size change
  const handleFontSizeChange = (fontSize) => {
    onUpdateElement({ fontSize });
  };

  // Handle text color change
  const handleColorChange = (fill) => {
    onUpdateElement({ fill });
  };

  // Handle text alignment change
  const handleAlignmentChange = (align) => {
    onUpdateElement({ align });
  };

  // Handle background shape change
  const handleBackgroundShapeChange = (backgroundShape) => {
    onUpdateElement({ backgroundShape });
  };

  // Handle border style change
  const handleBorderChange = (borderWidth, borderColor = "#000000") => {
    onUpdateElement({ borderWidth, borderColor });
  };

  // Handle background color change
  const handleBackgroundColorChange = (backgroundColor) => {
    onUpdateElement({ backgroundColor });
  };

  const toolbarStyle = {
    position: "absolute",
    left: position.x,
    top: position.y - 50, // Position above the element
    zIndex: 1000,
  };

  return (
    <Box bg="white" boxShadow="md" borderRadius="md" p={2} style={toolbarStyle}>
      <HStack spacing={1}>
        {/* Font Family */}
        <Menu>
          <Tooltip label="Font Family">
            <MenuButton
              as={Button}
              size="sm"
              variant="outline"
              fontFamily={element.fontFamily}
            >
              {element.fontFamily}
            </MenuButton>
          </Tooltip>
          <MenuList>
            {fontFamilies.map((font) => (
              <MenuItem
                key={font.name}
                fontFamily={font.name}
                onClick={() => handleFontFamilyChange(font.name)}
              >
                {font.name} ({font.type})
              </MenuItem>
            ))}
          </MenuList>
        </Menu>

        {/* Font Size */}
        <Popover>
          <PopoverTrigger>
            <Button size="sm" variant="outline">
              {element.fontSize}
            </Button>
          </PopoverTrigger>
          <PopoverContent w="200px">
            <PopoverBody>
              <VStack spacing={2}>
                <Slider
                  min={8}
                  max={72}
                  step={1}
                  defaultValue={element.fontSize}
                  onChange={handleFontSizeChange}
                >
                  <SliderTrack>
                    <SliderFilledTrack />
                  </SliderTrack>
                  <SliderThumb />
                </Slider>
                <Select
                  size="sm"
                  value={element.fontSize}
                  onChange={(e) =>
                    handleFontSizeChange(parseInt(e.target.value))
                  }
                >
                  {[8, 10, 12, 14, 16, 18, 20, 24, 30, 36, 48, 60, 72].map(
                    (size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    )
                  )}
                </Select>
              </VStack>
            </PopoverBody>
          </PopoverContent>
        </Popover>

        {/* Text Color */}
        <Menu>
          <Tooltip label="Text Color">
            <MenuButton
              as={IconButton}
              icon={<MdFormatColorText />}
              size="sm"
              variant="outline"
              color={element.fill}
            />
          </Tooltip>
          <MenuList>
            <Box p={2}>
              <HStack spacing={1} wrap="wrap">
                {colors.map((color) => (
                  <IconButton
                    key={color}
                    size="sm"
                    icon={<Box w="100%" h="100%" bg={color} />}
                    onClick={() => handleColorChange(color)}
                    aria-label={`Color ${color}`}
                  />
                ))}
              </HStack>
            </Box>
          </MenuList>
        </Menu>

        <Divider orientation="vertical" h="24px" />

        {/* Text Alignment */}
        <Tooltip label="Align Left">
          <IconButton
            icon={<MdFormatAlignLeft />}
            size="sm"
            variant={element.align === "left" ? "solid" : "outline"}
            onClick={() => handleAlignmentChange("left")}
            aria-label="Align Left"
          />
        </Tooltip>
        <Tooltip label="Align Center">
          <IconButton
            icon={<MdFormatAlignCenter />}
            size="sm"
            variant={element.align === "center" ? "solid" : "outline"}
            onClick={() => handleAlignmentChange("center")}
            aria-label="Align Center"
          />
        </Tooltip>
        <Tooltip label="Align Right">
          <IconButton
            icon={<MdFormatAlignRight />}
            size="sm"
            variant={element.align === "right" ? "solid" : "outline"}
            onClick={() => handleAlignmentChange("right")}
            aria-label="Align Right"
          />
        </Tooltip>

        <Divider orientation="vertical" h="24px" />

        {/* Background Shape */}
        <Menu>
          <Tooltip label="Background Shape">
            <MenuButton
              as={IconButton}
              icon={
                element.backgroundShape === "none" ? (
                  <FaSquare />
                ) : element.backgroundShape === "rectangle" ? (
                  <FaSquareFull />
                ) : element.backgroundShape === "rounded" ? (
                  <Box rounded="md" bg="gray.300" w="16px" h="16px" />
                ) : element.backgroundShape === "cloud" ? (
                  <BsCloudFill />
                ) : (
                  <BsFillChatLeftFill />
                )
              }
              size="sm"
              variant="outline"
            />
          </Tooltip>
          <MenuList>
            <MenuItem onClick={() => handleBackgroundShapeChange("none")}>
              None
            </MenuItem>
            <MenuItem onClick={() => handleBackgroundShapeChange("rectangle")}>
              Rectangle
            </MenuItem>
            <MenuItem onClick={() => handleBackgroundShapeChange("rounded")}>
              Rounded Rectangle
            </MenuItem>
            <MenuItem onClick={() => handleBackgroundShapeChange("cloud")}>
              Cloud
            </MenuItem>
            <MenuItem onClick={() => handleBackgroundShapeChange("speech")}>
              Speech Bubble
            </MenuItem>
          </MenuList>
        </Menu>

        {/* Background Color (only if there's a background shape) */}
        {element.backgroundShape !== "none" && (
          <Menu>
            <Tooltip label="Background Color">
              <MenuButton
                as={IconButton}
                icon={
                  <Box
                    w="16px"
                    h="16px"
                    bg={element.backgroundColor || "gray.200"}
                  />
                }
                size="sm"
                variant="outline"
              />
            </Tooltip>
            <MenuList>
              <Box p={2}>
                <HStack spacing={1} wrap="wrap">
                  {[...colors, "transparent"].map((color) => (
                    <IconButton
                      key={color}
                      size="sm"
                      icon={
                        <Box
                          w="100%"
                          h="100%"
                          bg={color}
                          border={
                            color === "transparent" ? "1px dashed gray" : "none"
                          }
                        />
                      }
                      onClick={() => handleBackgroundColorChange(color)}
                      aria-label={`Background Color ${color}`}
                    />
                  ))}
                </HStack>
              </Box>
            </MenuList>
          </Menu>
        )}

        {/* Border Style */}
        {element.backgroundShape !== "none" && (
          <Menu>
            <Tooltip label="Border Style">
              <MenuButton
                as={IconButton}
                icon={<MdBorderStyle />}
                size="sm"
                variant="outline"
              />
            </Tooltip>
            <MenuList>
              <MenuItem onClick={() => handleBorderChange(0)}>
                No Border
              </MenuItem>
              <MenuItem onClick={() => handleBorderChange(1)}>Thin</MenuItem>
              <MenuItem onClick={() => handleBorderChange(2)}>Medium</MenuItem>
              <MenuItem onClick={() => handleBorderChange(4)}>Thick</MenuItem>
            </MenuList>
          </Menu>
        )}
      </HStack>
    </Box>
  );
};

export default TextPropertiesToolbar;
