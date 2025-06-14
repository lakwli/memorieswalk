import { useState, useRef, useCallback } from "react";
import { useToast } from "@chakra-ui/react";
import memoryService from "../services/memoryService";
import { ELEMENT_STATES } from "../constants";

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
 * - Error handling and user feedback
 *
 * @param {Object} options - Configuration options
 * @param {Function} options.onUploadComplete - Callback when upload completes with image data
 * @param {Function} options.onUploadStateChange - Callback when upload state changes
 *
 * @returns {Object} Upload manager interface
 */
export const useUploadManager = ({ onUploadComplete, onUploadStateChange }) => {
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
              currentPhase: "processing",
              uploadStatus: "Loading images...",
              currentProgress: 90,
            });

            (async () => {
              try {
                // Steps 1-3: Pure upload processing
                const imageDataArray = await Promise.all(
                  progress.responseData.map(async (photo) => {
                    const blob = await memoryService.getPhoto(
                      photo.id,
                      ELEMENT_STATES.NEW
                    );
                    const objectURL = URL.createObjectURL(blob);

                    const img = await new Promise((resolve, reject) => {
                      const image = new window.Image();
                      image.crossOrigin = "anonymous";
                      image.src = objectURL;
                      image.onload = () => resolve(image);
                      image.onerror = () => {
                        URL.revokeObjectURL(objectURL);
                        reject(
                          new Error(`Failed to load image: ${photo.fileName}`)
                        );
                      };
                    });

                    // ✅ Return clean image data - no canvas positioning
                    return {
                      ...photo,
                      image: img,
                      objectURL,
                      originalWidth: img.naturalWidth,
                      originalHeight: img.naturalHeight,
                      size: blob.size,
                    };
                  })
                );

                // Filter out failed loads
                const validImageData = imageDataArray.filter(
                  (data) => data !== null
                );

                updateUploadState({
                  currentPhase: "completed",
                  uploadStatus: "Upload completed!",
                  currentProgress: 100,
                });

                // ✅ Pass clean image data to MemoryEditorPage
                onUploadComplete?.(validImageData);

                toast({
                  title: "Upload Complete",
                  description: "Photos uploaded successfully",
                  status: "success",
                  duration: 2000,
                  isClosable: true,
                });

                resetUploadState(2000);
              } catch (error) {
                console.error("Image processing error:", error);
                updateUploadState({
                  currentPhase: "failed",
                  uploadStatus: `Processing failed: ${error.message.substring(
                    0,
                    30
                  )}...`,
                  currentProgress: 100,
                });
                toast({
                  title: "Processing Error",
                  description: `Failed to process images: ${error.message}`,
                  status: "error",
                  duration: 5000,
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
    [updateUploadState, resetUploadState, toast, onUploadComplete]
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
