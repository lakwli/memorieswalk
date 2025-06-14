export const deviceUtils = {
  /**
   * Detect actual device type based on user agent and capabilities
   */
  getDeviceType: function () {
    // Check for touch capability
    const isTouchDevice =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;

    // Check user agent for mobile indicators
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile =
      /mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(
        userAgent
      );
    const isTablet = /tablet|ipad/i.test(userAgent);

    if (isMobile && !isTablet) return "mobile";
    if (isTablet || (isTouchDevice && window.innerWidth >= 768))
      return "tablet";
    return "desktop";
  },

  /**
   * Get screen size category based on width (primary) and area (secondary)
   * Width is more important for photo layout decisions
   */
  getScreenSizeCategory: function (width) {
    // ✅ Fix: Use width as primary factor, not minDimension
    // For photo sizing, horizontal space is more important than vertical

    if (width < 600) return "small"; // Mobile-like widths
    if (width < 900) return "medium"; // Tablet-like widths
    if (width < 1400) return "large"; // Desktop widths
    return "xlarge"; // Large desktop/monitor widths
  },
};
