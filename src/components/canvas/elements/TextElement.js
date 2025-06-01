import { BaseCanvasElement } from "./BaseCanvasElement.js";
import { ELEMENT_TYPES } from "../../../constants/elementTypes.js";

export class TextElement extends BaseCanvasElement {
  constructor(props = {}) {
    super({ ...props, type: ELEMENT_TYPES.TEXT });
    this.text = props.text || "New Text";
    this.fontSize = Math.max(8, Math.min(props.fontSize || 24, 144));
    this.fontFamily = props.fontFamily || "Arial";
    this.fill = props.fill || "#000000";
    this.fontStyle = props.fontStyle || "normal";
    this.textDecoration = props.textDecoration || "";
    this.align = props.align || "left";
    this.wrap = props.wrap || "word";
  }

  toSaveData() {
    return {
      ...super.toSaveData(),
      text: this.text,
      fontSize: this.fontSize,
      fontFamily: this.fontFamily,
      fill: this.fill,
      fontStyle: this.fontStyle,
      textDecoration: this.textDecoration,
      align: this.align,
      wrap: this.wrap,
    };
  }
}
