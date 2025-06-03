import { BaseCanvasElement } from "./BaseCanvasElement.js";
import { ELEMENT_TYPES } from "../../../constants/elementTypes.js";

export class TextElement extends BaseCanvasElement {
  constructor(props = {}) {
    super({ ...props, type: ELEMENT_TYPES.TEXT });
    this.text = props.text || "New Text";
    this.fontSize = Math.max(8, Math.min(props.fontSize || 24, 72));
    this.fontFamily = props.fontFamily || "Arial";
    this.fill = props.fill || "#000000";
    this.fontStyle = props.fontStyle || "normal";
    this.textDecoration = props.textDecoration || "";
    this.align = props.align || "center";
    this.verticalAlign = props.verticalAlign || "middle";
    this.wrap = props.wrap || "word";
    this.width = props.width || 200;
    this.height = props.height || 60;
    this.padding = props.padding || 10;
    this.backgroundColor = props.backgroundColor || "";
    this.backgroundShape = props.backgroundShape || "none"; // none, rectangle, rounded, cloud, speech
    this.borderColor = props.borderColor || "";
    this.borderWidth = props.borderWidth || 0;
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
      verticalAlign: this.verticalAlign,
      wrap: this.wrap,
      width: this.width,
      height: this.height,
      padding: this.padding,
      backgroundColor: this.backgroundColor,
      backgroundShape: this.backgroundShape,
      borderColor: this.borderColor,
      borderWidth: this.borderWidth,
    };
  }
}
