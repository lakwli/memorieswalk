import React, { useRef, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { Text as KonvaText, Rect, Group, Path } from "react-konva";

// Helper function to generate cloud shape path
const generateCloudPath = (width, height, padding = 10) => {
  const totalWidth = width + padding * 2;
  const totalHeight = height + padding * 2;

  // Cloud bumps parameters
  const bumpSize = Math.min(totalWidth, totalHeight) * 0.15;
  const bumpCount = Math.max(4, Math.floor(totalWidth / 50));

  let path = `M${padding + bumpSize},${padding} `;

  // Top edge with bumps
  for (let i = 1; i < bumpCount; i++) {
    const x = padding + (i * (totalWidth - padding * 2)) / bumpCount;
    path += `Q${x + bumpSize / 2},${padding - bumpSize} ${
      x + bumpSize
    },${padding} `;
  }

  // Right edge with bumps
  for (let i = 0; i < bumpCount - 1; i++) {
    const y = padding + (i * (totalHeight - padding * 2)) / (bumpCount - 1);
    path += `Q${totalWidth + bumpSize},${y + bumpSize / 2} ${totalWidth},${
      y + bumpSize
    } `;
  }

  // Bottom edge with bumps
  for (let i = bumpCount; i > 0; i--) {
    const x = padding + (i * (totalWidth - padding * 2)) / bumpCount;
    path += `Q${x - bumpSize / 2},${totalHeight + bumpSize} ${
      x - bumpSize
    },${totalHeight} `;
  }

  // Left edge with bumps
  for (let i = bumpCount - 1; i > 0; i--) {
    const y = padding + (i * (totalHeight - padding * 2)) / (bumpCount - 1);
    path += `Q${padding - bumpSize},${y - bumpSize / 2} ${padding},${
      y - bumpSize
    } `;
  }

  path += "Z";
  return path;
};

// Helper function to generate speech bubble shape path
const generateSpeechBubblePath = (width, height, padding = 10) => {
  const totalWidth = width + padding * 2;
  const totalHeight = height + padding * 2;
  const cornerRadius = Math.min(totalWidth, totalHeight) * 0.1;
  const tailSize = Math.min(totalWidth, totalHeight) * 0.2;

  // Basic rounded rectangle with a tail at the bottom
  let path = `M${padding + cornerRadius},${padding} `;
  path += `L${totalWidth - cornerRadius},${padding} `;
  path += `Q${totalWidth},${padding} ${totalWidth},${padding + cornerRadius} `;
  path += `L${totalWidth},${totalHeight - cornerRadius} `;
  path += `Q${totalWidth},${totalHeight} ${
    totalWidth - cornerRadius
  },${totalHeight} `;

  // Bottom side with tail
  path += `L${totalWidth / 2 + tailSize},${totalHeight} `;
  path += `L${totalWidth / 2},${totalHeight + tailSize} `;
  path += `L${totalWidth / 2 - tailSize},${totalHeight} `;

  path += `L${padding + cornerRadius},${totalHeight} `;
  path += `Q${padding},${totalHeight} ${padding},${
    totalHeight - cornerRadius
  } `;
  path += `L${padding},${padding + cornerRadius} `;
  path += `Q${padding},${padding} ${padding + cornerRadius},${padding} `;
  path += "Z";

  return path;
};

export const TextRenderer = ({
  element,
  behaviors,
  onUpdate,
  onEditStart,
  onEditEnd,
  isBeingEdited = false,
}) => {
  const textRef = useRef();
  const groupRef = useRef();
  const textareaRef = useRef(null); // Track active textarea

  // Calculate actual width and height based on the text content
  const width = element.width || 200;
  const height = element.height || 60;
  const padding = element.padding || 10;

  // Helper function to update textarea styling
  const updateTextareaStyle = useCallback(
    (textarea, elementProps) => {
      if (!textarea || !elementProps) return;

      const stage = textRef.current?.getStage();
      if (!stage) return;

      const textPosition = textRef.current?.absolutePosition();
      if (!textPosition) return;

      const scale = stage.scaleX();

      textarea.style.width = `${(elementProps.width || width) * scale}px`;
      textarea.style.height = `${(elementProps.height || height) * scale}px`;
      textarea.style.fontSize = `${elementProps.fontSize * scale}px`;
      textarea.style.fontFamily = elementProps.fontFamily;
      textarea.style.color = elementProps.fill;
      textarea.style.background =
        elementProps.backgroundColor || "rgba(255, 255, 255, 0.7)";
      textarea.style.textAlign = elementProps.align || "center";
      textarea.style.padding = `${(elementProps.padding || padding) * scale}px`;
    },
    [width, height, padding]
  );

  // Effect to update textarea styling when element properties change during editing
  useEffect(() => {
    if (isBeingEdited && textareaRef.current) {
      updateTextareaStyle(textareaRef.current, element);
    }
  }, [element, isBeingEdited, updateTextareaStyle]);

  // Handle double-click to edit text
  const handleTextDblClick = (e) => {
    if (isBeingEdited) return;

    // Notify parent that editing has started (this will trigger toolbar editing mode)
    if (onEditStart) {
      onEditStart();
    }

    const stage = e.target.getStage();
    const textPosition = textRef.current.absolutePosition();

    // Create textarea overlay for editing
    const textarea = document.createElement("textarea");
    textareaRef.current = textarea; // Store reference for updates
    document.body.appendChild(textarea);

    // Position the textarea over the text element
    const stageBox = stage.container().getBoundingClientRect();

    // Set initial textarea style
    textarea.value = element.text;
    textarea.style.position = "absolute";
    textarea.style.top = `${stageBox.top + textPosition.y}px`;
    textarea.style.left = `${stageBox.left + textPosition.x}px`;
    textarea.style.border = "1px dashed #000";
    textarea.style.margin = "0";
    textarea.style.overflow = "hidden";
    textarea.style.outline = "none";
    textarea.style.resize = "none";
    textarea.style.lineHeight = "1";
    textarea.style.zIndex = "1000";
    textarea.style.transformOrigin = "left top";
    textarea.style.transform = `rotate(${element.rotation || 0}deg)`;

    // Apply current element styling
    updateTextareaStyle(textarea, element);

    // Hide the text on canvas while editing
    textRef.current.visible(false);
    stage.batchDraw();

    // Focus and select all text
    textarea.focus();
    textarea.select();

    // Handle text changes
    const handleTextChange = () => {
      if (onUpdate) {
        onUpdate({
          ...element,
          text: textarea.value,
        });
      }
    };

    // Finish editing
    const finishEditing = () => {
      textareaRef.current = null; // Clear reference
      document.body.removeChild(textarea);
      textRef.current.visible(true);
      stage.batchDraw();

      // Notify parent that editing has ended
      if (onEditEnd) {
        onEditEnd();
      }
    };

    // Set event handlers
    textarea.addEventListener("keydown", (e) => {
      // Enter + shift adds newline, but Enter alone completes editing
      if (e.keyCode === 13 && !e.shiftKey) {
        handleTextChange();
        finishEditing();
      }
      // Escape cancels editing without changes
      if (e.keyCode === 27) {
        finishEditing();
      }
    });

    textarea.addEventListener("blur", () => {
      handleTextChange();
      finishEditing();
    });
  };

  // Determine background component based on element.backgroundShape
  const renderBackground = () => {
    const bgProps = {
      width: width + padding * 2,
      height: height + padding * 2,
      x: -padding,
      y: -padding,
      fill: element.backgroundColor || "transparent",
      stroke:
        element.borderWidth > 0
          ? element.borderColor || "#000000"
          : "transparent",
      strokeWidth: element.borderWidth || 0,
    };

    switch (element.backgroundShape) {
      case "rectangle":
        return <Rect {...bgProps} />;
      case "rounded":
        return <Rect {...bgProps} cornerRadius={10} />;
      case "cloud":
        return (
          <Path
            {...bgProps}
            data={generateCloudPath(width, height, padding)}
            strokeWidth={element.borderWidth || 0}
          />
        );
      case "speech":
        return (
          <Path
            {...bgProps}
            data={generateSpeechBubblePath(width, height, padding)}
            strokeWidth={element.borderWidth || 0}
          />
        );
      default:
        return null;
    }
  };

  return (
    <React.Fragment key={element.id}>
      <Group
        ref={groupRef}
        id={element.id}
        x={element.x}
        y={element.y}
        rotation={element.rotation || 0}
        draggable={element.draggable}
        onMouseEnter={behaviors.handleElementMouseEnter()}
        onMouseLeave={behaviors.handleElementMouseLeave()}
        onDragStart={behaviors.handleElementDragStart()}
        onDragEnd={behaviors.handleElementDragEnd(element)}
        onClick={behaviors.handleElementClick(element)}
        onDblClick={handleTextDblClick}
      >
        {/* Background shape if applicable */}
        {element.backgroundShape &&
          element.backgroundShape !== "none" &&
          renderBackground()}

        {/* Text content */}
        <KonvaText
          ref={textRef}
          text={element.text}
          fontSize={element.fontSize}
          fontFamily={element.fontFamily}
          fill={element.fill}
          width={width}
          height={height}
          align={element.align}
          verticalAlign={element.verticalAlign}
          wrap={element.wrap}
          fontStyle={element.fontStyle}
          textDecoration={element.textDecoration}
        />
      </Group>
    </React.Fragment>
  );
};

TextRenderer.propTypes = {
  element: PropTypes.shape({
    id: PropTypes.string.isRequired,
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
    text: PropTypes.string.isRequired,
    fontSize: PropTypes.number.isRequired,
    fontFamily: PropTypes.string.isRequired,
    fill: PropTypes.string.isRequired,
    width: PropTypes.number,
    height: PropTypes.number,
    rotation: PropTypes.number,
    draggable: PropTypes.bool,
    align: PropTypes.string,
    verticalAlign: PropTypes.string,
    backgroundColor: PropTypes.string,
    backgroundShape: PropTypes.string,
    borderColor: PropTypes.string,
    borderWidth: PropTypes.number,
    padding: PropTypes.number,
    wrap: PropTypes.string,
    fontStyle: PropTypes.string,
    textDecoration: PropTypes.string,
  }).isRequired,
  behaviors: PropTypes.shape({
    handleElementMouseEnter: PropTypes.func.isRequired,
    handleElementMouseLeave: PropTypes.func.isRequired,
    handleElementDragStart: PropTypes.func.isRequired,
    handleElementDragEnd: PropTypes.func.isRequired,
    handleElementClick: PropTypes.func.isRequired,
  }).isRequired,
  onUpdate: PropTypes.func,
  onEditStart: PropTypes.func,
  onEditEnd: PropTypes.func,
  isBeingEdited: PropTypes.bool,
};
