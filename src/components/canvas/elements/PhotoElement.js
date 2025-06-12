import { BaseCanvasElement } from "./BaseCanvasElement.js";
import { ELEMENT_TYPES } from "../../../constants/elementTypes.js";

export class PhotoElement extends BaseCanvasElement {
  constructor(props = {}) {
    super({ ...props, type: ELEMENT_TYPES.PHOTO });
    this.image = props.image || null;
    this.src = props.src || "";
    this.opacity = props.opacity || 1;
    this.filters = props.filters || [];
    this.objectURL = props.objectURL;
    this.originalWidth = props.originalWidth;
    this.originalHeight = props.originalHeight;
    this.size = props.size || 0;
  }

  // Override to include photo-specific properties
  getProps() {
    return {
      ...super.getProps(),
      image: this.image,
      src: this.src,
      opacity: this.opacity,
      filters: this.filters,
    };
  }

  toSaveData() {
    return {
      ...super.toSaveData(),
      originalWidth: this.originalWidth,
      originalHeight: this.originalHeight,
      size: this.size,
    };
  }

  cleanup() {
    if (this.objectURL) {
      URL.revokeObjectURL(this.objectURL);
    }
  }
}
