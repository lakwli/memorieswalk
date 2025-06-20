// Photo Tool - Handles photo element creation and positioning
import { PhotoElement } from "../elements";

export class PhotoTool {
  constructor(canvasConfig) {
    this.canvasConfig = canvasConfig;
    this.defaultConfig = {
      rotation: 0,
      opacity: 1,
      filters: [],
    };
  }

  /**
   * Create photo element from persisted data
   */
  createPhotoElementFromData(photoData, photoConfig, img, objectURL) {
    const fallbackPosition = { x: 100, y: 100 };

    return new PhotoElement({
      ...this.defaultConfig,
      ...photoData,
      image: img,
      objectURL,
      x: photoConfig.x !== undefined ? photoConfig.x : fallbackPosition.x,
      y: photoConfig.y !== undefined ? photoConfig.y : fallbackPosition.y,
      width: photoConfig.width || img.naturalWidth / 4,
      height: photoConfig.height || img.naturalHeight / 4,
      rotation: photoConfig.rotation || 0,
      originalWidth: photoData.originalWidth || img.naturalWidth,
      originalHeight: photoData.originalHeight || img.naturalHeight,
      size: photoData.size || 0,
    });
  }

  /**
   * Update default photo configuration
   */
  updateDefaultConfig(newConfig) {
    this.defaultConfig = { ...this.defaultConfig, ...newConfig };
  }

  /**
   * Get current default configuration
   */
  getDefaultConfig() {
    return { ...this.defaultConfig };
  }
}
