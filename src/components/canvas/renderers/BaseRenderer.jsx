import React from "react";
import PropTypes from "prop-types";
import { Group } from "react-konva";

export class BaseRenderer {
  constructor(props) {
    this.element = props.element;
    this.interactionHandlers = props.interactionHandlers;
    this.onUpdate = props.onUpdate;
    this.isBeingEdited = props.isBeingEdited;
    this.setEditingRenderRef = props.setEditingRenderRef;
    this.groupRef = React.createRef();
    this.textRef = props.textRef || React.createRef();
    //this.version = this.element?.version || 0;
  }
  displayInfo() {
    const type = this.constructor.name;
    const id = this.element?.id || "unknown";
    // Log both the ref object and its current value
    console.log(
      `Renderer Type: ${type}, Element ID: ${id}`,
      "textRef:",
      this.textRef,
      "textRef.current:",
      this.textRef.current
    );
    return `Renderer [Type: ${type}, Element ID: ${id}], textRef: ${this.textRef}, textRef.current: ${this.textRef.current}`;
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
    console.log(
      `🔶 [DRAG START]  handleElementDragStart =====ID=${this.element.id}, ELM:x=${this.element.x}, y=${this.element.y}`
    );

    e.cancelBubble = true;

    // Set grabbing cursor when element drag starts
    const stage = e.target.getStage();
    if (stage && stage.container()) {
      stage.container().style.cursor = "grabbing";
    }
  }

  handleElementDragEnd(e) {
    const node = e.target;
    console.log(
      `🔶 [DRAG END] handleElementDragEnd =====ID=${
        this.element.id
      }, NODE:x=${node.x()}, y=${node.y()}`
    );

    e.cancelBubble = true;
    const newX = node.x();
    const newY = node.y();
    // Reset cursor based on current mouse position
    const stage = node.getStage();
    if (stage && stage.container()) {
      const currentTarget = stage.getIntersection(stage.getPointerPosition());
      const isStillOverElement = currentTarget && currentTarget !== stage;
      stage.container().style.cursor = isStillOverElement ? "move" : "grab";
    }

    if (this.onUpdate) {
      this.onUpdate(this.element.id, {
        x: newX,
        y: newY,
      });
    }
  }

  // Handle blur event when user clicks outside the textbox. It is detected by MemoryEditorPage click handler
  // This is used to cancel editing and revert to the original state
  handleBlurTrigger(e) {
    console.log(`🔶 [USER] On Blur on textbox  ID=${this.element.id}`);
    const result = this.captureInputChange(e);
    if (result) {
      this.interactionHandlers.onEditEnd(result)(e);
    }
    this.onUITurnToEditCompleteMode(e);
    this.isBeingEdited = false;
    this.setEditingRenderRef(null);
  }
  handleKeyboardTrigger(e) {
    // Enter + shift adds newline, but Enter alone completes editing
    if (e.key === "Enter" && !e.shiftKey) {
      console.log(`🔶 [USER] Press ENTER on textbox  ID=${this.element.id}`);
      const result = this.captureInputChange(e);
      if (result) {
        this.interactionHandlers.onEditEnd(result)(e);
      }
      this.onUITurnToEditCompleteMode(e);
      this.isBeingEdited = false;
      this.setEditingRenderRef(null);
    }
    // Escape cancels editing without changes
    if (e.key === "Escape") {
      console.log(
        `🔶 [USER] Press Escape on textbox  ID=${this.element.id} ${this.textRef.current}`
      );
      this.onUITurnToEditCompleteMode(e);
      this.interactionHandlers.onEditCancel()(e);
      this.isBeingEdited = false;
      this.setEditingRenderRef(null);
    }
  }

  handleToolbarUpdate(update) {
    this.handleToolbarUpdateUI(update);
  }
  handleToolbarUpdateUI(update) {
    // Default: do nothing or throw to force subclass to implement
    throw new Error(
      "handleToolbarUpdateUI must be implemented by subclass",
      update
    );
  }

  handleElementDoubleClick(e) {
    console.log(
      `🔶 [USER] Double Click ID=${this.element.id} EDIT?:${this.isBeingEdited}`
    );
    if (this.isBeingEdited) return;
    e.cancelBubble = true;

    this.interactionHandlers.onEditStart(this.element)(e);

    this.onUITurnToEditMode(e);
    this.isBeingEdited = true;

    this.setEditingRenderRef(this);
  }
  onUITurnToEditMode(e) {
    // Default: do nothing or throw to force subclass to implement
    throw new Error("onUITurnToEditMode must be implemented by subclass", e);
  }
  captureInputChange(e) {
    // Default: do nothing or throw to force subclass to implement
    throw new Error("captureInputChange must be implemented by subclass", e);
  }
  onUITurnToEditCompleteMode(e) {
    // Default: do nothing or throw to force subclass to implement
    throw new Error(
      "onUITurnToEditCompleteMode must be implemented by subclass",
      e
    );
  }
  handleElementTransform(e) {
    //console.log("🔶 BaseRenderer handleElementTransform");
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

    console.log("🔶 [USER] Transform updates:", updates);

    // Update through the onUpdate prop
    if (this.onUpdate) {
      this.onUpdate(this.element.id, updates);
    }
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
  //TODO: check if to use id + version + type as key. It seems that element does change even with same key
  render() {
    // if (this.isBeingEdited && this.element.id === this.selectedElementId) {
    //  return null;
    //}
    return (
      <React.Fragment key={`${this.element.id}-${this.element.version}`}>
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
    onEditStart: PropTypes.func.isRequired,
    onEditEnd: PropTypes.func.isRequired,
    handleElementDelete: PropTypes.func.isRequired,
  }).isRequired,
  onUpdate: PropTypes.func,
  setEditingRenderRef: PropTypes.func,
  isBeingEdited: PropTypes.bool,
};
