import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Flex,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  NumberInput,
  NumberInputField,
  Select,
  Tooltip,
  ButtonGroup,
} from "@chakra-ui/react";
import {
  FaBold,
  FaItalic,
  FaUnderline,
  FaAlignLeft,
  FaAlignCenter,
  FaAlignRight,
} from "react-icons/fa";

const MIN_FONT_SIZE = 8;
const MAX_FONT_SIZE = 144;
const DEFAULT_FONT_SIZE = 24;

const TextPropertiesToolbar = ({ element, onUpdate }) => {
  const [inputValue, setInputValue] = useState(
    String(DEFAULT_FONT_SIZE) // Initial default
  );

  useEffect(() => {
    if (element && typeof element.fontSize === "number") {
      const currentFontSize = Math.max(
        MIN_FONT_SIZE,
        Math.min(element.fontSize, MAX_FONT_SIZE)
      );
      setInputValue(String(currentFontSize));
    } else if (element) {
      // Element exists but fontSize might not be set (e.g. new text)
      setInputValue(String(DEFAULT_FONT_SIZE));
    }
    // If no element, inputValue retains its last state or initial default,
    // which is fine as the component will likely return null anyway.
  }, [element]); // Correctly depend on the element object

  if (!element || element.type !== "text") {
    return null;
  }

  const handlePropertyChange = (property, value) => {
    onUpdate({ [property]: value });
  };

  const toggleFontStyle = (style) => {
    let currentStyle = element.fontStyle || "";
    let styles = currentStyle.split(" ").filter((s) => s && s !== "normal");

    if (style === "bold") {
      if (styles.includes("bold")) {
        styles = styles.filter((s) => s !== "bold");
      } else {
        styles.push("bold");
      }
    } else if (style === "italic") {
      if (styles.includes("italic")) {
        styles = styles.filter((s) => s !== "italic");
      } else {
        styles.push("italic");
      }
    }

    if (styles.includes("bold") && styles.includes("italic")) {
      currentStyle = "bold italic";
    } else if (styles.includes("bold")) {
      currentStyle = "bold";
    } else if (styles.includes("italic")) {
      currentStyle = "italic";
    } else {
      currentStyle = "normal";
    }
    onUpdate({ fontStyle: currentStyle });
  };

  const toggleTextDecoration = (decoration) => {
    let currentDecoration = element.textDecoration || "";
    if (currentDecoration.includes(decoration)) {
      currentDecoration = currentDecoration.replace(decoration, "").trim();
    } else {
      currentDecoration = currentDecoration
        ? `${currentDecoration} ${decoration}`.trim()
        : decoration;
    }
    onUpdate({ textDecoration: currentDecoration });
  };

  const isBold = element.fontStyle?.includes("bold");
  const isItalic = element.fontStyle?.includes("italic");
  const isUnderline = element.textDecoration?.includes("underline");

  return (
    <Flex
      as="nav"
      p={2}
      bg="gray.100"
      borderBottom="1px solid"
      borderColor="gray.300"
      boxShadow="sm"
      wrap="wrap"
      gap={4}
      alignItems="center"
      justifyContent="flex-start"
      width="100%"
    >
      <FormControl display="flex" alignItems="center" width="auto">
        <FormLabel fontSize="sm" mb={0} mr={2} whiteSpace="nowrap">
          Font:
        </FormLabel>
        <Select
          size="sm"
          value={element.fontFamily || "Arial"}
          onChange={(e) => handlePropertyChange("fontFamily", e.target.value)}
          width="150px"
        >
          <option value="Arial">Arial</option>
          <option value="Verdana">Verdana</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Courier New">Courier New</option>
          <option value="Georgia">Georgia</option>
          <option value="Comic Sans MS">Comic Sans MS</option>
        </Select>
      </FormControl>

      <FormControl display="flex" alignItems="center" width="auto">
        <FormLabel fontSize="sm" mb={0} mr={2} whiteSpace="nowrap">
          Size:
        </FormLabel>
        <NumberInput
          size="sm"
          value={inputValue}
          min={MIN_FONT_SIZE}
          max={MAX_FONT_SIZE}
          onChange={(valueString, valueNumber) => {
            setInputValue(valueString); // Update input field immediately

            if (valueString === "") {
              // Allow empty input during typing
              return;
            }

            // valueNumber is Chakra's parsed number (can be NaN)
            if (!isNaN(valueNumber)) {
              if (
                valueNumber >= MIN_FONT_SIZE &&
                valueNumber <= MAX_FONT_SIZE
              ) {
                // If it's a valid number in range, update parent state
                if (valueNumber !== element.fontSize) {
                  handlePropertyChange("fontSize", valueNumber);
                }
              }
              // If valueNumber is a number but out of range (e.g. 2 or 200),
              // inputValue is updated, but we don't call handlePropertyChange.
              // onBlur will handle final clamping.
            }
            // If valueString is not a number (e.g. "abc"), valueNumber is NaN.
            // inputValue is updated. onBlur will handle resetting.
          }}
          onBlur={() => {
            let num = parseInt(inputValue, 10);
            let finalClampedValue;

            if (isNaN(num)) {
              // If input is not a number (or empty), revert to current valid fontSize or MIN_FONT_SIZE
              finalClampedValue =
                element &&
                typeof element.fontSize === "number" &&
                element.fontSize >= MIN_FONT_SIZE &&
                element.fontSize <= MAX_FONT_SIZE
                  ? element.fontSize
                  : MIN_FONT_SIZE;
            } else if (num < MIN_FONT_SIZE) {
              finalClampedValue = MIN_FONT_SIZE;
            } else if (num > MAX_FONT_SIZE) {
              finalClampedValue = MAX_FONT_SIZE;
            } else {
              finalClampedValue = num; // Valid and in range
            }

            setInputValue(String(finalClampedValue));

            if (finalClampedValue !== element.fontSize) {
              handlePropertyChange("fontSize", finalClampedValue);
            }
          }}
          width="80px"
        >
          <NumberInputField />
        </NumberInput>
      </FormControl>

      <ButtonGroup size="sm" isAttached variant="outline">
        <Tooltip label="Bold">
          <IconButton
            aria-label="Bold"
            icon={<FaBold />}
            onClick={() => toggleFontStyle("bold")}
            isActive={isBold}
          />
        </Tooltip>
        <Tooltip label="Italic">
          <IconButton
            aria-label="Italic"
            icon={<FaItalic />}
            onClick={() => toggleFontStyle("italic")}
            isActive={isItalic}
          />
        </Tooltip>
        <Tooltip label="Underline">
          <IconButton
            aria-label="Underline"
            icon={<FaUnderline />}
            onClick={() => toggleTextDecoration("underline")}
            isActive={isUnderline}
          />
        </Tooltip>
      </ButtonGroup>

      <ButtonGroup size="sm" isAttached variant="outline">
        <Tooltip label="Align Left">
          <IconButton
            aria-label="Align Left"
            icon={<FaAlignLeft />}
            onClick={() => handlePropertyChange("align", "left")}
            isActive={element.align === "left"}
          />
        </Tooltip>
        <Tooltip label="Align Center">
          <IconButton
            aria-label="Align Center"
            icon={<FaAlignCenter />}
            onClick={() => handlePropertyChange("align", "center")}
            isActive={element.align === "center"}
          />
        </Tooltip>
        <Tooltip label="Align Right">
          <IconButton
            aria-label="Align Right"
            icon={<FaAlignRight />}
            onClick={() => handlePropertyChange("align", "right")}
            isActive={element.align === "right"}
          />
        </Tooltip>
      </ButtonGroup>
    </Flex>
  );
};

TextPropertiesToolbar.propTypes = {
  element: PropTypes.shape({
    id: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    fontFamily: PropTypes.string,
    fontSize: PropTypes.number,
    fontStyle: PropTypes.string,
    textDecoration: PropTypes.string,
    align: PropTypes.string,
    fill: PropTypes.string,
  }),
  onUpdate: PropTypes.func.isRequired,
};

export default TextPropertiesToolbar;
