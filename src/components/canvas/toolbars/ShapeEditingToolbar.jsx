import PropTypes from "prop-types";
import {
  HStack,
  VStack,
  Button,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Text,
  SimpleGrid,
  Box,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  IconButton,
  Tooltip,
} from "@chakra-ui/react";
import { MdCheck, MdColorLens, MdLineWeight } from "react-icons/md";

/**
 * ShapeEditingToolbar - Editing controls for shape/pen elements
 * 
 * Provides shape-specific editing controls like stroke color, width, etc.
 */
export const ShapeEditingToolbar = ({ element, onUpdate, onFinishEditing }) => {
  // Color palette for shapes
  const colors = [
    "#000000", // Black
    "#FF0000", // Red
    "#00FF00", // Green
    "#0000FF", // Blue
    "#FFFF00", // Yellow
    "#FF00FF", // Magenta
    "#00FFFF", // Cyan
    "#FFA500", // Orange
  ];

  const handleUpdateProperty = (property, value) => {
    onUpdate({
      ...element,
      [property]: value,
    });
  };

  return (
    <VStack spacing={2} align="stretch" minW="300px">
      {/* Primary Controls Row */}
      <HStack spacing={4}>
        {/* Stroke Width Control */}
        <VStack spacing={1} minW="120px">
          <HStack>
            <MdLineWeight />
            <Text fontSize="sm">Stroke Width</Text>
          </HStack>
          <Slider
            aria-label="stroke-width"
            defaultValue={element.strokeWidth || 2}
            min={1}
            max={20}
            step={1}
            onChange={(value) => handleUpdateProperty("strokeWidth", value)}
          >
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb />
          </Slider>
        </VStack>

        {/* Stroke Color */}
        <Popover>
          <PopoverTrigger>
            <Tooltip label="Stroke Color" hasArrow>
              <IconButton
                icon={<MdColorLens />}
                size="sm"
                variant="outline"
                colorScheme="gray"
                style={{ color: element.stroke || "#000000" }}
                aria-label="Stroke color"
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
                    borderColor={element.stroke === color ? "blue.500" : "gray.300"}
                    borderRadius="md"
                    cursor="pointer"
                    onClick={() => handleUpdateProperty("stroke", color)}
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
    </VStack>
  );
};

ShapeEditingToolbar.propTypes = {
  element: PropTypes.shape({
    strokeWidth: PropTypes.number,
    stroke: PropTypes.string,
  }).isRequired,
  onUpdate: PropTypes.func.isRequired,
  onFinishEditing: PropTypes.func.isRequired,
};
