import React from "react";
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
    // All existing logging code stays exactly the same
    const renderCount = (window.rendererFactoryCounts =
      window.rendererFactoryCounts || {});
    const key = `${element.type}-${element.id}`;
    renderCount[key] = (renderCount[key] || 0) + 1;

    const RendererComponent = this.renderers[element.type];
    if (!RendererComponent) {
      console.warn(`No renderer found for element type: ${element.type}`);
      return null;
    }

    return (() => {
      console.log(`🔄 [RENDER]: ${element.id}-${element.version}-React`);
      return (
        <RendererComponent
          key={`${element.id}-${element.version}-React`}
          element={element}
          {...props}
        />
      );
    })();
  }

  static registerRenderer(type, rendererComponent) {
    this.renderers[type] = React.memo(rendererComponent);
  }
}
