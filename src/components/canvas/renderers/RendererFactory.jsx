import React from "react";
import { ELEMENT_TYPES } from "../../../constants/elementTypes.js";
import { PhotoRenderer } from "./PhotoRenderer.jsx";
import { TextRenderer } from "./TextRenderer.jsx";
import { PenRenderer } from "./PenRenderer.jsx";

export class RendererFactory {
  static renderers = {
    [ELEMENT_TYPES.PHOTO]: React.memo(PhotoRenderer),
    [ELEMENT_TYPES.TEXT]: React.memo(TextRenderer),
    [ELEMENT_TYPES.PEN]: React.memo(PenRenderer),
  };

  static createRenderer(element, props) {
    // All existing logging code stays exactly the same
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

    if (renderCount[key] > 2) {
      console.warn(
        `🚨 EXCESSIVE RENDERS: ${key} has rendered ${renderCount[key]} times!`
      );
    }

    const propsKeys = Object.keys(props);
    console.log("🔍 RendererFactory elementProps keys:", propsKeys);
    console.log("🔍 RendererFactory isBeingEdited:", props.isBeingEdited);

    const RendererComponent = this.renderers[element.type];
    if (!RendererComponent) {
      console.warn(`No renderer found for element type: ${element.type}`);
      return null;
    }

    return <RendererComponent key={element.id} element={element} {...props} />;
  }

  static registerRenderer(type, rendererComponent) {
    this.renderers[type] = React.memo(rendererComponent);
  }
}
