import { useState, useRef, useCallback } from "react";
import { useToast } from "@chakra-ui/react";
import memoryService from "../services/memoryService";
import { PhotoElement } from "../components/canvas/elements";

// Helper function to format bytes
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

/**
 * Upload Manager Hook
 *
 * Encapsulates all file upload functionality including:
 * - Upload progress state management
 * - File compression and upload processing
 * - Canvas integration for uploaded photos
 * - Error handling and user feedback
 *
 * @param {Object} options - Configuration options
 * @param {Function} options.onPhotoAdded - Callback when photos are successfully added
 * @param {Function} options.onUploadStateChange - Callback when upload state changes
 * @param {Object} options.canvasConfig - Canvas configuration for positioning
 * @param {Object} options.elementStates - Ref to element states
 *
 * @returns {Object} Upload manager interface
 */
export const useUploadManager = ({
  onPhotoAdded,
  onUploadStateChange,
  canvasConfig,
  elementStates,
}) => {
  const toast = useToast();
  const fileInputRef = useRef(null);

  // Upload progress state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [currentProgress, setCurrentProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState("");

  // Update upload state and notify parent
  const updateUploadState = useCallback(
    (state) => {
      const newState = {
        isUploading: state.isUploading ?? isUploading,
        uploadStatus: state.uploadStatus ?? uploadStatus,
        currentProgress: state.currentProgress ?? currentProgress,
        currentPhase: state.currentPhase ?? currentPhase,
      };

      if (state.isUploading !== undefined) setIsUploading(state.isUploading);
      if (state.uploadStatus !== undefined) setUploadStatus(state.uploadStatus);
      if (state.currentProgress !== undefined)
        setCurrentProgress(state.currentProgress);
      if (state.currentPhase !== undefined) setCurrentPhase(state.currentPhase);

      onUploadStateChange?.(newState);
    },
    [
      isUploading,
      uploadStatus,
      currentProgress,
      currentPhase,
      onUploadStateChange,
    ]
  );

  // Reset upload state
  const resetUploadState = useCallback(
    (delay = 2000) => {
      setTimeout(() => {
        updateUploadState({
          isUploading: false,
          uploadStatus: "",
          currentProgress: 0,
          currentPhase: "",
        });
      }, delay);
    },
    [updateUploadState]
  );

  // Main file upload handler
  const handleFileUpload = useCallback(
    async (e) => {
      const filesArray = Array.from(e.target.files);
      if (!filesArray || filesArray.length === 0) return;

      updateUploadState({
        isUploading: true,
        currentPhase: "compressing",
        uploadStatus: `Preparing ${filesArray[0].name}...`,
        currentProgress: 0,
      });

      const onProgressCallback = (progress) => {
        console.log("Upload Progress:", progress);

        switch (progress.type) {
          case "compression_start": {
            const compressingFileName =
              progress.fileName ||
              (filesArray.length > 0 ? filesArray[0].name : "file");
            updateUploadState({
              currentPhase: "compressing",
              uploadStatus: `Compressing ${compressingFileName}...`,
              currentProgress:
                filesArray.length > 1
                  ? (progress.fileIndex / progress.totalFiles) * 100
                  : 50,
            });
            break;
          }

          case "compression_end": {
            const compressedFileName =
              progress.fileName ||
              (filesArray.length > 0 ? filesArray[0].name : "file");
            const originalSizeFormatted = formatBytes(progress.originalSize);
            const processedSizeFormatted = formatBytes(progress.processedSize);
            updateUploadState({
              currentPhase: "compressing",
              uploadStatus: `Compressed ${compressedFileName}: ${originalSizeFormatted} → ${processedSizeFormatted}`,
              currentProgress:
                filesArray.length > 1
                  ? ((progress.fileIndex + 1) / progress.totalFiles) * 100
                  : 100,
            });
            break;
          }

          case "all_files_processed":
            // All files compressed, preparing for upload
            break;

          case "upload_start":
            updateUploadState({
              currentPhase: "uploading",
              uploadStatus: `Uploading (${formatBytes(
                progress.totalSizeToUpload
              )})...`,
              currentProgress: 0,
            });
            break;

          case "upload_complete": {
            updateUploadState({
              currentPhase: "loading_to_canvas",
              uploadStatus: "Processing...",
              currentProgress: 50,
            });

            (async () => {
              try {
                const newPhotoElements = await Promise.all(
                  progress.responseData.map(async (photo) => {
                    const blob = await memoryService.getPhoto(photo.id, "N");
                    const objectURL = URL.createObjectURL(blob);

                    return new Promise((resolve) => {
                      const img = new window.Image();
                      img.crossOrigin = "anonymous";
                      img.src = objectURL;
                      img.onload = () => {
                        // Store element state
                        elementStates.current[photo.id] = "N";

                        // Calculate photo position based on canvas configuration
                        let photoX = 200;
                        let photoY = 200;

                        if (canvasConfig?.stageRef?.current) {
                          const stage = canvasConfig.stageRef.current;
                          const stageWidth = stage.width();
                          const stageHeight = stage.height();
                          const currentScale = canvasConfig.stageScale || 1;
                          const currentPosition =
                            canvasConfig.stagePosition || { x: 0, y: 0 };

                          // Calculate center of current viewport in canvas coordinates
                          photoX =
                            (-currentPosition.x + stageWidth / 2) /
                            currentScale;
                          photoY =
                            (-currentPosition.y + stageHeight / 2) /
                            currentScale;

                          // Offset slightly to avoid overlapping photos
                          photoX -= img.naturalWidth / 4 / 2;
                          photoY -= img.naturalHeight / 4 / 2;
                        }

                        // Create PhotoElement with viewport-centered position
                        const photoElement = new PhotoElement({
                          ...photo,
                          image: img,
                          objectURL,
                          x: photoX,
                          y: photoY,
                          width: img.naturalWidth / 4,
                          height: img.naturalHeight / 4,
                          rotation: 0,
                          originalWidth: img.naturalWidth,
                          originalHeight: img.naturalHeight,
                          size: blob.size,
                        });

                        resolve(photoElement);
                      };
                      img.onerror = () => {
                        URL.revokeObjectURL(objectURL);
                        resolve(null);
                      };
                    });
                  })
                );

                // Filter out failed photo elements
                const validPhotoElements = newPhotoElements.filter(
                  (p) => p !== null
                );

                // Notify parent component with new photo elements
                onPhotoAdded?.(validPhotoElements);

                updateUploadState({
                  currentPhase: "completed",
                  uploadStatus: "Photo added!",
                  currentProgress: 100,
                });

                toast({
                  title: "Photo Added",
                  description: "Successfully added to the canvas.",
                  status: "success",
                  duration: 2000,
                  isClosable: true,
                });

                resetUploadState(2000);
              } catch (loadErr) {
                console.error("Error processing uploaded photos:", loadErr);
                updateUploadState({
                  currentPhase: "failed",
                  uploadStatus: "Error displaying photo.",
                  currentProgress: 100,
                });
                toast({
                  title: "Error after upload",
                  description:
                    "Photo uploaded, but failed to display it on canvas.",
                  status: "warning",
                  duration: 4000,
                  isClosable: true,
                });
                resetUploadState(4000);
              }
            })();
            break;
          }

          case "upload_error":
            updateUploadState({
              currentPhase: "failed",
              uploadStatus: `Upload error: ${progress.error.message.substring(
                0,
                30
              )}...`,
              currentProgress: 100,
            });
            toast({
              title: "Upload Error",
              description: `Failed to upload photo(s): ${progress.error.message}`,
              status: "error",
              duration: 4000,
              isClosable: true,
            });
            resetUploadState(4000);
            break;

          default:
            break;
        }
      };

      try {
        await memoryService.uploadPhotos(filesArray, onProgressCallback);
      } catch (uploadErr) {
        console.error("Upload error:", uploadErr);
        updateUploadState({
          currentPhase: "failed",
          uploadStatus: `Upload failed: ${uploadErr.message.substring(
            0,
            30
          )}...`,
          currentProgress: 100,
        });
        toast({
          title: "Upload Error",
          description: `Failed to upload photo: ${uploadErr.message}`,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        resetUploadState(4000);
      } finally {
        if (e.target) {
          e.target.value = "";
        }
      }
    },
    [
      updateUploadState,
      resetUploadState,
      toast,
      onPhotoAdded,
      elementStates,
      canvasConfig,
    ]
  );

  // Trigger photo upload
  const triggerPhotoUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Return upload manager interface
  return {
    // State
    isUploading,
    uploadStatus,
    currentProgress,
    currentPhase,

    // Actions
    handleFileUpload,
    triggerPhotoUpload,
    resetUploadState,

    // Refs
    fileInputRef,
  };
};

export default useUploadManager;
