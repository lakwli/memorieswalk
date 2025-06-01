import { BaseCanvasElement } from "./BaseCanvasElement.js";
import { ELEMENT_TYPES } from "../../../constants/elementTypes.js";

export class PenElement extends BaseCanvasElement {
  constructor(props = {}) {
    super({ ...props, type: ELEMENT_TYPES.PEN });
    this.points = props.points || [];
    this.strokeColor = props.strokeColor || "#000000";
    this.strokeWidth = props.strokeWidth || 2;
    this.tension = props.tension || 0.5;
    this.closed = props.closed || false;
  }

  toSaveData() {
    return {
      ...super.toSaveData(),
      points: this.points,
      strokeColor: this.strokeColor,
      strokeWidth: this.strokeWidth,
      tension: this.tension,
      closed: this.closed,
    };
  }

  addPoint(x, y) {
    this.points.push(x, y);
    return this;
  }

  getBounds() {
    if (this.points.length === 0) return super.getBounds();

    const xs = this.points.filter((_, i) => i % 2 === 0);
    const ys = this.points.filter((_, i) => i % 2 === 1);

    return {
      x: Math.min(...xs),
      y: Math.min(...ys),
      width: Math.max(...xs) - Math.min(...xs),
      height: Math.max(...ys) - Math.min(...ys),
    };
  }
}
