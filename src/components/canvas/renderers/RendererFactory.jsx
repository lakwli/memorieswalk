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
    // ✅ Add performance tracking
    const renderCount = (window.rendererFactoryCounts =
      window.rendererFactoryCounts || {});
    const key = `${element.type}-${element.id}`;
    renderCount[key] = (renderCount[key] || 0) + 1;

    console.log("🔍 RendererFactory createRenderer");
    console.log("🔍 RendererFactory element.type", element.type);
    console.log(
      "🔍 RendererFactory render count for",
      key,
      ":",
      renderCount[key]
    );

    // ✅ Warn about excessive renders
    if (renderCount[key] > 2) {
      console.warn(
        `🚨 EXCESSIVE RENDERS: ${key} has rendered ${renderCount[key]} times!`
      );
    }

    // ✅ Log props changes to see what's causing re-renders
    const propsKeys = Object.keys(props);
    console.log("🔍 RendererFactory elementProps keys:", propsKeys);
    console.log("🔍 RendererFactory isBeingEdited:", props.isBeingEdited);

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
