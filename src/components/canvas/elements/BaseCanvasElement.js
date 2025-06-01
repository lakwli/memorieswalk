export class BaseCanvasElement {
  constructor(props = {}) {
    this.id =
      props.id || `${props.type}-${Math.random().toString(36).substr(2, 9)}`;
    this.type = props.type;
    this.x = props.x || 0;
    this.y = props.y || 0;
    this.width = props.width || 100;
    this.height = props.height || 100;
    this.rotation = props.rotation || 0;
    this.draggable = props.draggable !== undefined ? props.draggable : true;
    this.selectable = props.selectable !== undefined ? props.selectable : true;
    this.deletable = props.deletable !== undefined ? props.deletable : true;

    // Common behavior flags
    this.isSelected = false;
    this.isHovered = false;
  }

  // Common methods that all elements should have
  move(x, y) {
    this.x = x;
    this.y = y;
    return this;
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
    return this;
  }

  rotate(rotation) {
    this.rotation = rotation;
    return this;
  }

  // Transform data for saving
  toSaveData() {
    return {
      id: this.id,
      type: this.type,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      rotation: this.rotation,
    };
  }

  // Get bounds for zoom-to-fit calculations
  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }
}
