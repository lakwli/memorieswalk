// ES Module version of the canvas optimizer from the plan

/**
 * Utility to optimize canvas data for storage and transmission
 */
const canvasOptimizer = {
  /**
   * Optimizes canvas data by removing unnecessary properties from Fabric.js objects.
   * This is a basic example; more sophisticated optimization might be needed
   * depending on the complexity of Fabric.js objects used.
   * @param {Object} canvasData - The full canvas data object (typically from canvas.toJSON())
   * @return {Object} Optimized canvas data
   */
  optimize: (canvasData) => {
    if (!canvasData || typeof canvasData !== "object") {
      return canvasData;
    }

    // Create a deep copy to avoid modifying the original object in memory
    // This is important if the original canvasData object is still in use.
    const optimized = JSON.parse(JSON.stringify(canvasData));

    // Process objects array if it exists
    if (Array.isArray(optimized.objects)) {
      optimized.objects = optimized.objects.map((obj) => {
        // Fabric.js objects store many internal/cached properties.
        // We only want to keep properties that are essential for reloading the canvas.
        // This list might need adjustment based on the Fabric.js features used.

        // Common properties to keep (adjust as needed):
        const essentialProps = [
          "type",
          "version",
          "originX",
          "originY",
          "left",
          "top",
          "width",
          "height",
          "fill",
          "stroke",
          "strokeWidth",
          "strokeDashArray",
          "strokeLineCap",
          "strokeDashOffset",
          "strokeLineJoin",
          "strokeUniform",
          "strokeMiterLimit",
          "scaleX",
          "scaleY",
          "angle",
          "flipX",
          "flipY",
          "opacity",
          "shadow",
          "visible",
          "backgroundColor",
          "clipPathURL",
          "clipPath",
          "paintFirst",
          "fillRule",
          "globalCompositeOperation",
          "skewX",
          "skewY",
          "id", // Custom ID if you assign one
          // Text-specific
          "text",
          "fontSize",
          "fontWeight",
          "fontFamily",
          "fontStyle",
          "lineHeight",
          "underline",
          "overline",
          "linethrough",
          "textAlign",
          "textBackgroundColor",
          "charSpacing",
          "styles",
          // Image-specific
          "src",
          "crossOrigin",
          "filters",
          // Path-specific / SVG
          "path",
          "pathOffset",
          "fromSVG",
          // Group-specific
          "objects", // For groups, recursively optimize
          // Add any other custom properties you rely on
        ];

        const optimizedObj = {};
        for (const prop of essentialProps) {
          if (obj[prop] !== undefined && obj[prop] !== null) {
            // Special handling for nested objects like 'filters' or 'shadow' if they need optimization
            if (prop === "objects" && Array.isArray(obj[prop])) {
              // For groups
              optimizedObj[prop] = obj[prop].map(
                (groupObj) =>
                  canvasOptimizer.optimize({ objects: [groupObj] }).objects[0]
              );
            } else if (
              prop === "clipPath" &&
              obj[prop] &&
              typeof obj[prop] === "object"
            ) {
              // If clipPath is an object itself, it might need its own optimization logic
              // For simplicity, we'll keep it as is or you can recursively call optimize
              // Example: optimizedObj[prop] = canvasOptimizer.optimize({ objects: [obj[prop]] }).objects[0];
              // However, ensure this doesn't lead to infinite recursion if clipPath can reference parent.
              // Fabric.js toJSON usually handles this, but be mindful.
              optimizedObj[prop] = obj[prop];
            } else {
              optimizedObj[prop] = obj[prop];
            }
          }
        }

        // If you have custom properties on objects, ensure they are included in essentialProps
        // or handled separately.

        return optimizedObj;
      });
    }

    // Remove top-level properties that might be large and not always needed for reload
    // delete optimized.backgroundImage; // If not always needed or handled differently
    // delete optimized.overlayImage;  // If not always needed or handled differently

    return optimized;
  },

  /**
   * Calculates the approximate size of canvas data when stringified to JSON.
   * @param {Object} canvasData - Canvas data object
   * @return {Number} Size in bytes (UTF-8 encoding)
   */
  getSize: (canvasData) => {
    try {
      const jsonString = JSON.stringify(canvasData);
      return Buffer.byteLength(jsonString, "utf8");
    } catch (error) {
      console.error("Error calculating canvas size:", error);
      return Infinity; // Return Infinity to indicate an error or very large size
    }
  },
};

export default canvasOptimizer;
