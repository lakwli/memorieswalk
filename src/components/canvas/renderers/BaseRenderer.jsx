import React from "react";
import PropTypes from "prop-types";
import { Group } from "react-konva";

export class BaseRenderer {
  constructor(props) {
    this.element = props.element;
    this.interactionHandlers = props.interactionHandlers;
    this.onUpdate = props.onUpdate;
    this.onEditStart = props.onEditStart;
    this.onEditEnd = props.onEditEnd;
    this.isBeingEdited = props.isBeingEdited;
    this.groupRef = React.createRef();
  }

  // Base properties - automatically available to all child classes
  get elementProps() {
    const props = this.element.getProps?.() || {};
    return {
      ref: this.groupRef, // ← Add generic ref to all Groups
      id: this.element.id, // ← Ensure all Groups have element ID
      ...props,
      onDragStart: this.handleElementDragStart.bind(this),
      onDragEnd: this.handleElementDragEnd.bind(this),
      onDblClick: this.handleElementDoubleClick.bind(this), // ← Called by BaseRenderer
      onTransformEnd: this.handleElementTransform.bind(this), // ← Called by BaseRenderer
    };
  }

  handleElementDragStart(e) {
    console.log("🔶 ===== BaseRenderer handleElementDragStart =====");
    console.log("🔶 Element ID:", this.element.id);

    e.cancelBubble = true;

    // Set grabbing cursor when element drag starts
    const stage = e.target.getStage();
    if (stage && stage.container()) {
      stage.container().style.cursor = "grabbing";
    }

    console.log("🔶 handleElementDragStart completed");
  }

  handleElementDragEnd(e) {
    console.log("🔶 ===== BaseRenderer handleElementDragEnd =====");
    console.log("🔶 Element ID:", this.element.id);

    e.cancelBubble = true;

    // Element updates its own position first
    const node = e.target;
    const oldX = this.element.x;
    const oldY = this.element.y;
    const newX = node.x();
    const newY = node.y();

    console.log("🔶 Position change:", {
      from: { x: oldX, y: oldY },
      to: { x: newX, y: newY },
    });

    this.element.x = newX;
    this.element.y = newY;

    // Reset cursor based on current mouse position
    const stage = node.getStage();
    if (stage && stage.container()) {
      const currentTarget = stage.getIntersection(stage.getPointerPosition());
      const isStillOverElement = currentTarget && currentTarget !== stage;
      stage.container().style.cursor = isStillOverElement ? "move" : "grab";
    }

    console.log("🔶 About to call onUpdate...");

    // Directly call updateElement to sync with React state
    if (this.onUpdate) {
      this.onUpdate(this.element.id, {
        x: this.element.x,
        y: this.element.y,
      });
    }

    console.log("🔶 onUpdate called");
    console.log("🔶 handleElementDragEnd completed");
  }

  handleElementDoubleClick(e) {
    e.cancelBubble = true;
    return this.interactionHandlers.handleElementDoubleClick(this.element)(e);
  }

  handleElementTransform(e) {
    console.log("🔶 BaseRenderer handleElementTransform");
    e.cancelBubble = true;

    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Reset scale to avoid compounding
    node.scaleX(1);
    node.scaleY(1);

    const updates = {
      x: node.x(),
      y: node.y(),
      rotation: node.rotation(),
    };

    // Call overridable resize method for element-specific sizing
    const sizeUpdates = this.resize(scaleX, scaleY, node);
    Object.assign(updates, sizeUpdates);

    console.log("🔶 Transform updates:", updates);

    // Update through the onUpdate prop
    this.onUpdate(this.element.id, updates);
  }

  // Default resize behavior - can be overridden by subclasses
  resize(scaleX, scaleY, node) {
    return {
      width: Math.round(node.width() * scaleX),
      height: Math.round(node.height() * scaleY),
    };
  }

  handleElementDelete() {
    return this.interactionHandlers.handleElementDelete(this.element);
  }

  // Abstract method - must be implemented by subclasses
  renderContent() {
    throw new Error("renderContent must be implemented by subclass");
  }

  // Common render method
  render() {
    return (
      <React.Fragment key={this.element.id}>
        <Group {...this.elementProps}>{this.renderContent()}</Group>
      </React.Fragment>
    );
  }
}

// Base PropTypes that all renderers inherit
BaseRenderer.basePropTypes = {
  element: PropTypes.shape({
    id: PropTypes.string.isRequired,
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
    rotation: PropTypes.number,
    draggable: PropTypes.bool,
  }).isRequired,
  interactionHandlers: PropTypes.shape({
    handleElementDoubleClick: PropTypes.func.isRequired,
    handleElementDelete: PropTypes.func.isRequired,
  }).isRequired,
  onUpdate: PropTypes.func,
  onEditStart: PropTypes.func,
  onEditEnd: PropTypes.func,
  isBeingEdited: PropTypes.bool,
};
