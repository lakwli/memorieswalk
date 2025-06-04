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
} from "@chakra-ui/react";
import { MdCheck, MdBrightness6, MdContrast } from "react-icons/md";

/**
 * PhotoEditingToolbar - Editing controls for photo elements
 *
 * Provides photo-specific editing controls like brightness, contrast, etc.
 */
export const PhotoEditingToolbar = ({ element, onUpdate, onFinishEditing }) => {
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
        {/* Brightness Control */}
        <VStack spacing={1} minW="100px">
          <HStack>
            <MdBrightness6 />
            <Text fontSize="sm">Brightness</Text>
          </HStack>
          <Slider
            aria-label="brightness"
            defaultValue={element.brightness || 1}
            min={0}
            max={2}
            step={0.1}
            onChange={(value) => handleUpdateProperty("brightness", value)}
          >
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb />
          </Slider>
        </VStack>

        {/* Contrast Control */}
        <VStack spacing={1} minW="100px">
          <HStack>
            <MdContrast />
            <Text fontSize="sm">Contrast</Text>
          </HStack>
          <Slider
            aria-label="contrast"
            defaultValue={element.contrast || 1}
            min={0}
            max={2}
            step={0.1}
            onChange={(value) => handleUpdateProperty("contrast", value)}
          >
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb />
          </Slider>
        </VStack>

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

PhotoEditingToolbar.propTypes = {
  element: PropTypes.shape({
    brightness: PropTypes.number,
    contrast: PropTypes.number,
  }).isRequired,
  onUpdate: PropTypes.func.isRequired,
  onFinishEditing: PropTypes.func.isRequired,
};
