import { ELEMENT_TYPES } from "../../../constants/elementTypes.js";
import { PhotoRenderer } from "./PhotoRenderer.jsx";
import { TextRenderer } from "./TextRenderer.jsx";
import { PenRenderer } from "./PenRenderer.jsx";

export class RendererFactory {
  static renderers = {
    [ELEMENT_TYPES.PHOTO]: PhotoRenderer,
    [ELEMENT_TYPES.TEXT]: TextRenderer,
    [ELEMENT_TYPES.PEN]: PenRenderer,
  };

  static createRenderer(element, props) {
    const RendererComponent = this.renderers[element.type];
    if (!RendererComponent) {
      console.warn(`No renderer found for element type: ${element.type}`);
      return null;
    }

    // Don't extract key from props since it shouldn't be there
    // Just use element.id directly as the key
    return <RendererComponent key={element.id} element={element} {...props} />;
  }
  static registerRenderer(type, rendererComponent) {
    this.renderers[type] = rendererComponent;
  }
}
