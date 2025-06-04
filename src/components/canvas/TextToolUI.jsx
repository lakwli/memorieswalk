import React, { useState, useEffect } from "react";
import {
  Box,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  Button,
  HStack,
  Select,
  IconButton,
  Tooltip,
  Divider,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Text,
  VStack,
  SimpleGrid,
} from "@chakra-ui/react";
import {
  MdFormatAlignLeft,
  MdFormatAlignCenter,
  MdFormatAlignRight,
  MdFormatColorText,
} from "react-icons/md";
import {
  FaSquare,
  FaRegSquare,
  FaWindowRestore,
  FaCloudversify,
  FaComment,
} from "react-icons/fa";

/**
 * TextToolUI Component
 * Provides UI controls for text element editing
 */
const TextToolUI = ({ selectedElement, updateElement, stageRef }) => {
  const [stageBox, setStageBox] = useState(null);

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

  // State to track the position of the selected text element
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });

  // Update stage position and toolbar position when selectedElement changes
  useEffect(() => {
    if (stageRef?.current && selectedElement) {
      const stage = stageRef.current;
      const container = stage.container();
      const stageRect = container.getBoundingClientRect();
      setStageBox(stageRect);

      // Find the text node to position the toolbar near it
      const node = stage.findOne("#" + selectedElement.id);
      if (node) {
        // Get the actual position and dimensions from the Konva node
        const nodePosition = node.getAbsolutePosition();
        const nodeWidth = node.width() || selectedElement.width || 200;
        const nodeHeight = node.height() || selectedElement.height || 50;

        // Convert node position to screen coordinates
        const scale = stage.scaleX();
        const screenX = nodePosition.x * scale + stageRect.left;
        const screenY = nodePosition.y * scale + stageRect.top;

        // Position toolbar well above the text element, centered horizontally
        const toolbarHeight = 60; // Toolbar height
        const topGap = 80; // Gap between toolbar and text element to prevent overlap

        const newTop = screenY - toolbarHeight - topGap;
        const newLeft = screenX + (nodeWidth * scale) / 2; // Center horizontally on the text element

        setToolbarPosition({
          top: Math.max(stageRect.top + 10, newTop), // Ensure it's not offscreen at top
          left: Math.max(
            stageRect.left + 100,
            Math.min(stageRect.right - 300, newLeft)
          ), // Keep within stage bounds with margins
        });
      }
    }
  }, [stageRef, selectedElement]);

  // Don't render if no text is selected
  if (!selectedElement || selectedElement.type !== "text") {
    return null;
  }

  // Handler for updating text properties
  const handleUpdateProperty = (property, value) => {
    updateElement({
      ...selectedElement,
      [property]: value,
    });
  };

  return (
    <Box
      position="absolute"
      top={`${toolbarPosition.top}px`}
      left={`${toolbarPosition.left}px`}
      transform="translateX(-50%)"
      zIndex={1000}
      bg="white"
      boxShadow="md"
      borderRadius="md"
      p={2}
    >
      <HStack spacing={2}>
        {/* Font Family */}
        <Select
          size="sm"
          width="140px"
          value={selectedElement.fontFamily}
          onChange={(e) => handleUpdateProperty("fontFamily", e.target.value)}
        >
          {fontFamilies.map((font) => (
            <option key={font.name} value={font.name}>
              {font.name}
            </option>
          ))}
        </Select>

        {/* Font Size */}
        <Popover placement="top">
          <PopoverTrigger>
            <Button size="sm" minW="60px">
              {selectedElement.fontSize}px
            </Button>
          </PopoverTrigger>
          <PopoverContent width="200px">
            <PopoverBody>
              <VStack spacing={3}>
                <Slider
                  min={8}
                  max={72}
                  step={1}
                  value={selectedElement.fontSize}
                  onChange={(val) => handleUpdateProperty("fontSize", val)}
                >
                  <SliderTrack>
                    <SliderFilledTrack />
                  </SliderTrack>
                  <SliderThumb />
                </Slider>
                <SimpleGrid columns={4} spacing={1} width="100%">
                  {fontSizes.map((size) => (
                    <Button
                      key={size}
                      size="xs"
                      variant={
                        selectedElement.fontSize === size ? "solid" : "outline"
                      }
                      onClick={() => handleUpdateProperty("fontSize", size)}
                    >
                      {size}
                    </Button>
                  ))}
                </SimpleGrid>
              </VStack>
            </PopoverBody>
          </PopoverContent>
        </Popover>

        <Divider orientation="vertical" height="24px" />

        {/* Text Alignment */}
        <Tooltip label="Align Left">
          <IconButton
            icon={<MdFormatAlignLeft />}
            size="sm"
            variant={selectedElement.align === "left" ? "solid" : "ghost"}
            onClick={() => handleUpdateProperty("align", "left")}
          />
        </Tooltip>
        <Tooltip label="Align Center">
          <IconButton
            icon={<MdFormatAlignCenter />}
            size="sm"
            variant={selectedElement.align === "center" ? "solid" : "ghost"}
            onClick={() => handleUpdateProperty("align", "center")}
          />
        </Tooltip>
        <Tooltip label="Align Right">
          <IconButton
            icon={<MdFormatAlignRight />}
            size="sm"
            variant={selectedElement.align === "right" ? "solid" : "ghost"}
            onClick={() => handleUpdateProperty("align", "right")}
          />
        </Tooltip>

        <Divider orientation="vertical" height="24px" />

        {/* Text Color */}
        <Popover placement="top">
          <PopoverTrigger>
            <IconButton
              icon={<MdFormatColorText />}
              size="sm"
              aria-label="Text color"
              bg={selectedElement.fill}
              color={selectedElement.fill === "#000000" ? "white" : "black"}
            />
          </PopoverTrigger>
          <PopoverContent width="150px">
            <PopoverBody>
              <SimpleGrid columns={4} spacing={2}>
                {colors.map((color) => (
                  <Box
                    key={color}
                    as="button"
                    width="25px"
                    height="25px"
                    bg={color}
                    borderRadius="md"
                    border={
                      selectedElement.fill === color
                        ? "2px solid blue"
                        : "1px solid gray"
                    }
                    onClick={() => handleUpdateProperty("fill", color)}
                  />
                ))}
              </SimpleGrid>
            </PopoverBody>
          </PopoverContent>
        </Popover>

        <Divider orientation="vertical" height="24px" />

        {/* Background Shape */}
        <Popover placement="top">
          <PopoverTrigger>
            <Button
              size="sm"
              leftIcon={
                backgroundShapes.find(
                  (shape) => shape.id === selectedElement.backgroundShape
                )?.icon || backgroundShapes[0].icon
              }
            >
              {backgroundShapes.find(
                (shape) => shape.id === selectedElement.backgroundShape
              )?.name || "None"}
            </Button>
          </PopoverTrigger>
          <PopoverContent width="200px">
            <PopoverBody>
              <SimpleGrid columns={2} spacing={2}>
                {backgroundShapes.map((shape) => (
                  <Button
                    key={shape.id}
                    size="sm"
                    leftIcon={shape.icon}
                    justifyContent="flex-start"
                    variant={
                      selectedElement.backgroundShape === shape.id
                        ? "solid"
                        : "ghost"
                    }
                    onClick={() => {
                      handleUpdateProperty("backgroundShape", shape.id);
                      if (
                        shape.id !== "none" &&
                        !selectedElement.backgroundColor
                      ) {
                        handleUpdateProperty("backgroundColor", "#FFFFFF");
                      }
                    }}
                  >
                    {shape.name}
                  </Button>
                ))}
              </SimpleGrid>
            </PopoverBody>
          </PopoverContent>
        </Popover>

        {/* Background Color (only if shape is selected) */}
        {selectedElement.backgroundShape &&
          selectedElement.backgroundShape !== "none" && (
            <Popover placement="top">
              <PopoverTrigger>
                <Box
                  as="button"
                  width="24px"
                  height="24px"
                  bg={selectedElement.backgroundColor || "#FFFFFF"}
                  borderRadius="md"
                  border="1px solid gray"
                />
              </PopoverTrigger>
              <PopoverContent width="150px">
                <PopoverBody>
                  <SimpleGrid columns={4} spacing={2}>
                    {[...colors, "transparent"].map((color) => (
                      <Box
                        key={color}
                        as="button"
                        width="25px"
                        height="25px"
                        bg={color}
                        borderRadius="md"
                        border={
                          selectedElement.backgroundColor === color
                            ? "2px solid blue"
                            : "1px solid gray"
                        }
                        onClick={() =>
                          handleUpdateProperty("backgroundColor", color)
                        }
                        position="relative"
                      >
                        {color === "transparent" && (
                          <Text
                            fontSize="xs"
                            position="absolute"
                            top="50%"
                            left="50%"
                            transform="translate(-50%, -50%)"
                          >
                            T
                          </Text>
                        )}
                      </Box>
                    ))}
                  </SimpleGrid>
                </PopoverBody>
              </PopoverContent>
            </Popover>
          )}

        {/* Border settings (only if shape is selected) */}
        {selectedElement.backgroundShape &&
          selectedElement.backgroundShape !== "none" && (
            <Popover placement="top">
              <PopoverTrigger>
                <Button size="sm">Border</Button>
              </PopoverTrigger>
              <PopoverContent width="200px">
                <PopoverBody>
                  <VStack align="stretch" spacing={3}>
                    <Text fontSize="sm">Border Width</Text>
                    <Slider
                      min={0}
                      max={10}
                      step={1}
                      value={selectedElement.borderWidth || 0}
                      onChange={(val) =>
                        handleUpdateProperty("borderWidth", val)
                      }
                    >
                      <SliderTrack>
                        <SliderFilledTrack />
                      </SliderTrack>
                      <SliderThumb />
                    </Slider>

                    {selectedElement.borderWidth > 0 && (
                      <>
                        <Text fontSize="sm">Border Color</Text>
                        <SimpleGrid columns={4} spacing={2}>
                          {colors.map((color) => (
                            <Box
                              key={color}
                              as="button"
                              width="25px"
                              height="25px"
                              bg={color}
                              borderRadius="md"
                              border={
                                selectedElement.borderColor === color
                                  ? "2px solid blue"
                                  : "1px solid gray"
                              }
                              onClick={() =>
                                handleUpdateProperty("borderColor", color)
                              }
                            />
                          ))}
                        </SimpleGrid>
                      </>
                    )}
                  </VStack>
                </PopoverBody>
              </PopoverContent>
            </Popover>
          )}
      </HStack>
    </Box>
  );
};

export default TextToolUI;
