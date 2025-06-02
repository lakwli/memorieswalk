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
   * Create photo elements from uploaded files
   */
  async createPhotoElementsFromFiles(files, elementStates) {
    const { stageRef, stageScale, stagePosition } = this.canvasConfig;
    const photoElements = [];

    for (const file of files) {
      try {
        const photoElement = await this.createPhotoElementFromFile(
          file,
          elementStates,
          this.calculatePhotoPosition(stageRef, stageScale, stagePosition)
        );

        if (photoElement) {
          photoElements.push(photoElement);
        }
      } catch (error) {
        console.error("Failed to create photo element:", error);
      }
    }

    return photoElements;
  }

  /**
   * Create a single photo element from file
   */
  async createPhotoElementFromFile(file, elementStates, position) {
    return new Promise((resolve) => {
      const objectURL = URL.createObjectURL(file);
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.src = objectURL;

      img.onload = () => {
        const photoElement = new PhotoElement({
          image: img,
          objectURL,
          x: position.x,
          y: position.y,
          width: img.naturalWidth / 4,
          height: img.naturalHeight / 4,
          originalWidth: img.naturalWidth,
          originalHeight: img.naturalHeight,
          size: file.size,
          ...this.defaultConfig,
        });

        resolve(photoElement);
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectURL);
        resolve(null);
      };
    });
  }

  /**
   * Calculate optimal position for new photo
   */
  calculatePhotoPosition(stageRef, stageScale, stagePosition) {
    const stage = stageRef?.current;
    let photoX = 50;
    let photoY = 50;

    if (stage) {
      const stageWidth = stage.width();
      const stageHeight = stage.height();

      // Calculate center of current viewport in canvas coordinates
      photoX = (-stagePosition.x + stageWidth / 2) / stageScale;
      photoY = (-stagePosition.y + stageHeight / 2) / stageScale;

      // Offset slightly to avoid overlapping photos
      photoX -= 100; // Half of default photo width
      photoY -= 75; // Half of default photo height
    }

    return { x: photoX, y: photoY };
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
