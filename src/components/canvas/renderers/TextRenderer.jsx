import React from "react";
import PropTypes from "prop-types";
import { Text as KonvaText, Rect, Path } from "react-konva";
import { BaseRenderer } from "./BaseRenderer.jsx";

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

class TextRendererClass extends BaseRenderer {
  constructor(props) {
    super(props);
    //this.textRef = React.createRef();
    this.textareaRef = React.createRef();
  }

  // Helper function to update textarea styling
  updateTextareaStyle(textarea, elementProps) {
    if (!textarea || !elementProps) return;

    const stage = this.textRef.current?.getStage();
    if (!stage) return;

    const textPosition = this.textRef.current?.absolutePosition();
    if (!textPosition) return;

    const scale = stage.scaleX();
    const width = elementProps.width || 200;
    const height = elementProps.height || 60;
    const padding = elementProps.padding || 10;

    textarea.style.width = `${width * scale}px`;
    textarea.style.height = `${height * scale}px`;
    textarea.style.fontSize = `${elementProps.fontSize * scale}px`;
    textarea.style.fontFamily = elementProps.fontFamily;
    textarea.style.color = elementProps.fill;
    textarea.style.background =
      elementProps.backgroundColor || "rgba(255, 255, 255, 0.7)";
    textarea.style.textAlign = elementProps.align || "center";
    textarea.style.padding = `${padding * scale}px`;
  }

  // Override resize behavior for text elements
  resize(scaleX, scaleY) {
    console.log("📝 TextRenderer handleElementResize");

    // For text, resize the container dimensions, not the font
    const currentWidth = this.element.width || 200;
    const currentHeight = this.element.height || 60;

    return {
      width: Math.round(currentWidth * scaleX),
      height: Math.round(currentHeight * scaleY),
    };
  }

  handleToolbarUpdateUI(update) {
    console.log("🔧 [RENDER-TEXT-TOOLBAR] Reflect the text editing UI", update);

    if (this.textareaRef?.current) {
      if (update.fontFamily) {
        this.textareaRef.current.style.fontFamily = update.fontFamily;
      }
      if (update.fontSize) {
        this.textareaRef.current.style.fontSize = `${update.fontSize}px`;
      }
      // handle other style updates similarly
    }
  }

  onUITurnToEditMode(e) {
    console.log(
      "📝 [RENDER-TEXT-EDITMODE] Convert into text editing structure"
    );

    const stage = e.target.getStage();
    const textPosition = this.textRef.current.absolutePosition();

    // Create textarea overlay for editing
    const textarea = document.createElement("textarea");
    this.textareaRef.current = textarea; // Store reference for updates
    document.body.appendChild(textarea);

    // Position the textarea over the text element
    const stageBox = stage.container().getBoundingClientRect();

    // Set initial textarea style
    textarea.value = this.element.text;
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
    textarea.style.transform = `rotate(${this.element.rotation || 0}deg)`;

    // Apply current element styling
    this.updateTextareaStyle(textarea, this.element);

    // Hide the text on canvas while editing
    this.textRef.current.visible(false);
    stage.batchDraw();

    // Focus and select all text
    textarea.focus();
    textarea.select();

    // Set event handlers
    textarea.addEventListener("keydown", (e) => {
      super.handleKeyboardTrigger(e);
    });
    /** 
    textarea.addEventListener("blur", () => {
      super.handleBlurTrigger(e);
    });*/
  }

  // In TextRendererClass
  captureInputChange(e) {
    const textarea = e.target;
    return {
      id: this.element.id,
      update: {
        text: e.target.value,
        fontSize: parseInt(textarea.style.fontSize, 10),
        fontFamily: textarea.style.fontFamily,

        // ...any other fields you want to update
      },
    };
  }

  // Finish editing
  onUITurnToEditCompleteMode() {
    console.log("📝 [RENDER-TEXT-EDITMODE]  Leaving text editing structure");
    this.displayInfo();
    // Try to get textarea and stage from the event or from refs
    const textarea = this.textareaRef.current;
    const stage =
      this.textRef && this.textRef.current
        ? this.textRef.current.getStage()
        : null;

    // Defensive: only remove if textarea is a real DOM node and has a parent
    if (textarea && textarea instanceof Node && textarea.parentNode) {
      textarea.parentNode.removeChild(textarea);
    }
    this.textareaRef.current = null;
    if (this.textRef.current) this.textRef.current.visible(true);
    if (stage) stage.batchDraw();
  }
  renderBackground() {
    const width = this.element.width || 200;
    const height = this.element.height || 60;
    const padding = this.element.padding || 10;

    const bgProps = {
      width: width + padding * 2,
      height: height + padding * 2,
      x: -padding,
      y: -padding,
      fill: this.element.backgroundColor || "transparent",
      stroke:
        this.element.borderWidth > 0
          ? this.element.borderColor || "#000000"
          : "transparent",
      strokeWidth: this.element.borderWidth || 0,
    };

    switch (this.element.backgroundShape) {
      case "rectangle":
        return <Rect {...bgProps} />;
      case "rounded":
        return <Rect {...bgProps} cornerRadius={10} />;
      case "cloud":
        return (
          <Path
            {...bgProps}
            data={generateCloudPath(width, height, padding)}
            strokeWidth={this.element.borderWidth || 0}
          />
        );
      case "speech":
        return (
          <Path
            {...bgProps}
            data={generateSpeechBubblePath(width, height, padding)}
            strokeWidth={this.element.borderWidth || 0}
          />
        );
      default:
        return null;
    }
  }

  renderContent() {
    const width = this.element.width || 200;
    const height = this.element.height || 60;

    // Debug what elementProps contains
    //console.log("🔍 TextRenderer elementProps:", this.elementProps);
    //console.log("🔍 Element ID:", this.element.id);
    //console.log("🔍 Element getProps():", this.element.getProps?.());

    return (
      <React.Fragment>
        {this.element.backgroundShape &&
          this.element.backgroundShape !== "none" &&
          this.renderBackground()}

        <KonvaText
          ref={this.textRef}
          text={this.element.text}
          fontSize={this.element.fontSize}
          fontFamily={this.element.fontFamily}
          fill={this.element.fill}
          width={width}
          height={height}
          align={this.element.align}
          verticalAlign={this.element.verticalAlign}
          wrap={this.element.wrap}
          fontStyle={this.element.fontStyle}
          textDecoration={this.element.textDecoration}
        />
      </React.Fragment>
    );
  }
}

export const TextRenderer = (props) => {
  const renderer = new TextRendererClass(props);
  return renderer.render();
};

// Only define text-specific PropTypes, inherit base from parent
TextRenderer.propTypes = {
  ...BaseRenderer.basePropTypes,
  element: PropTypes.shape({
    ...BaseRenderer.basePropTypes.element,
    text: PropTypes.string.isRequired,
    fontSize: PropTypes.number.isRequired,
    fontFamily: PropTypes.string.isRequired,
    fill: PropTypes.string.isRequired,
    width: PropTypes.number,
    height: PropTypes.number,
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
};
