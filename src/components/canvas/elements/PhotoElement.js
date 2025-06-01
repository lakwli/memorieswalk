import { BaseCanvasElement } from "./BaseCanvasElement.js";
import { ELEMENT_TYPES } from "../../../constants/elementTypes.js";

export class PhotoElement extends BaseCanvasElement {
  constructor(props = {}) {
    super({ ...props, type: ELEMENT_TYPES.PHOTO });
    this.image = props.image;
    this.objectURL = props.objectURL;
    this.originalWidth = props.originalWidth;
    this.originalHeight = props.originalHeight;
    this.size = props.size || 0;
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
