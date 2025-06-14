export const canvasUtils = {
  /**
   * Get actual canvas dimensions from stage or fallback calculations
   * @param {RefObject} stageRef - Konva stage ref
   * @param {RefObject} containerRef - Container element ref (optional)
   * @returns {Object} { width, height, source }
   */
  getCanvasDimensions: function (stageRef, containerRef = null) {
    // Try stage first (most accurate)
    if (stageRef?.current) {
      return {
        width: stageRef.current.width(),
        height: stageRef.current.height(),
        source: "stage",
      };
    }

    // Try container next
    if (containerRef?.current) {
      return {
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
        source: "container",
      };
    }

    // Calculate from window (same logic as Stage component)
    return {
      width: window.innerWidth - 60, // Matches Stage width prop
      height: window.innerHeight - 120, // Matches Stage height prop
      source: "window",
    };
  },
};
