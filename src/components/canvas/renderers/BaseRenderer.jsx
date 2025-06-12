import React from "react";
import PropTypes from "prop-types";

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
    return {
      ...this.element.getProps(), // Element owns its data
      // Renderer only adds interaction behaviors
      onDragStart: this.handleElementDragStart.bind(this),
      onDragEnd: this.handleElementDragEnd.bind(this),
      onClick: this.handleElementClick.bind(this),
    };
  }

  handleElementDragStart(e) {
    e.cancelBubble = true;
    return this.interactionHandlers.handleElementDragStart()(e);
  }

  handleElementDragEnd(e) {
    e.cancelBubble = true;
    return this.interactionHandlers.handleElementDragEnd(this.element)(e);
  }

  handleElementClick(e) {
    e.cancelBubble = true;
    return this.interactionHandlers.handleElementClick(this.element)(e);
  }

  handleElementDoubleClick(e) {
    e.cancelBubble = true;
    return this.interactionHandlers.handleElementDoubleClick(this.element)(e);
  }

  handleElementTransform(e) {
    e.cancelBubble = true;
    return this.interactionHandlers.handleElementTransform(this.element)(e);
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
        {this.renderContent()}
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
    handleElementDragStart: PropTypes.func.isRequired,
    handleElementDragEnd: PropTypes.func.isRequired,
    handleElementClick: PropTypes.func.isRequired,
    handleElementDoubleClick: PropTypes.func.isRequired,
    handleElementTransform: PropTypes.func.isRequired,
    handleElementDelete: PropTypes.func.isRequired,
  }).isRequired,
  onUpdate: PropTypes.func,
  onEditStart: PropTypes.func,
  onEditEnd: PropTypes.func,
  isBeingEdited: PropTypes.bool,
};
