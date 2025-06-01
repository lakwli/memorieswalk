import { ELEMENT_TYPES } from "../../../constants/elementTypes.js";
import { PhotoElement } from "./PhotoElement.js";
import { TextElement } from "./TextElement.js";
import { PenElement } from "./PenElement.js";

export const createCanvasElement = (type, props = {}) => {
  switch (type) {
    case ELEMENT_TYPES.PHOTO:
      return new PhotoElement(props);
    case ELEMENT_TYPES.TEXT:
      return new TextElement(props);
    case ELEMENT_TYPES.PEN:
      return new PenElement(props);
    default:
      throw new Error(`Unknown element type: ${type}`);
  }
};
