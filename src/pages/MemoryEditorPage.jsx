import React, { useState, useEffect, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import { useParams, useNavigate } from "react-router-dom";
import {
  useToast,
  Box,
  Flex,
  Text,
  Button,
  HStack,
  IconButton,
  Input,
  Spinner,
  Progress,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Image,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Avatar,
  Tooltip,
} from "@chakra-ui/react";
import {
  Stage,
  Layer,
  Image as KonvaImage,
  Transformer,
  Text as KonvaText,
  Circle,
  Group,
} from "react-konva";
import {
  FaSave,
  FaEllipsisV,
  FaSearchPlus,
  FaSearchMinus,
  FaExpandArrowsAlt,
  FaCompressArrowsAlt,
  FaMousePointer,
  FaHandPaper,
  FaCog, // Added
  FaUpload, // Added
} from "react-icons/fa";
import { MdTextFields } from "react-icons/md";
import {
  ArrowBackIcon,
  EditIcon,
  CheckIcon,
  CloseIcon,
  AttachmentIcon,
  DeleteIcon,
  SettingsIcon, // Keep for consistency or use FaCog
  CheckCircleIcon, // Added
  WarningTwoIcon, // Added
} from "@chakra-ui/icons";
import { useAuth } from "../context/AuthContext";
import LogoSvg from "../assets/logo.svg";
import memoryService from "../services/memoryService";
import ErrorBoundary from "../components/ErrorBoundary";
import useCanvasNavigation from "./MemoryEditorPage/hooks/useCanvasNavigation";

const MIN_FONT_SIZE = 8;
const MAX_FONT_SIZE = 144;

// Helper function to format bytes
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

// DeleteButton component for photos
const DeleteButton = ({ x, y, onClick }) => {
  return (
    <Group x={x} y={y}>
      <Circle
        radius={15}
        fill="rgba(255, 0, 0, 0.7)"
        stroke="white"
        strokeWidth={2}
        onClick={onClick}
        onTap={onClick}
      />
      <KonvaText
        text="✕"
        fontSize={16}
        fill="white"
        align="center"
        verticalAlign="middle"
        x={-5}
        y={-8}
        onClick={onClick}
        onTap={onClick}
      />
    </Group>
  );
};

DeleteButton.propTypes = {
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  onClick: PropTypes.func.isRequired,
};

// Function to get status configuration (icon, colors)
const getStatusConfig = (phase) => {
  switch (phase) {
    case "compressing":
      return {
        icon: <FaCog />,
        colorScheme: "blue",
        textColor: "blue.600",
      };
    case "uploading":
      return {
        icon: <FaUpload />,
        colorScheme: "purple",
        textColor: "purple.600",
      };
    case "loading_to_canvas":
      return {
        icon: <Spinner size="xs" />,
        colorScheme: "orange",
        textColor: "orange.600",
      };
    case "completed":
      return {
        icon: <CheckCircleIcon />,
        colorScheme: "green",
        textColor: "green.600",
      };
    case "failed":
      return {
        icon: <WarningTwoIcon />,
        colorScheme: "red",
        textColor: "red.600",
      };
    default:
      return {
        icon: <Spinner size="xs" />,
        colorScheme: "gray",
        textColor: "gray.600",
      };
  }
};

const MemoryEditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user, logout } = useAuth();
  const [memory, setMemory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [title, setTitle] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [texts, setTexts] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [activeTool, setActiveTool] = useState(null);
  const [photoToDelete, setPhotoToDelete] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const cancelRef = useRef();

  // New state for upload/compression status
  const [uploadStatus, setUploadStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState(""); // 'compressing', 'uploading', 'loading_to_canvas', 'completed', 'failed'

  const stageContainerRef = useRef(null);
  const konvaStageRef = useRef(null);
  const fileInputRef = useRef(null);
  const trRef = useRef(null);

  // State to store initial canvas view settings from server
  const [initialViewState, setInitialViewState] = useState({
    scale: 1,
    position: { x: 0, y: 0 },
  });

  // Ref to track if we've applied the view state
  const viewStateAppliedRef = useRef(false);

  // Use custom navigation hook for canvas zoom and pan
  const {
    stageScale,
    stagePosition,
    isPanningMode,
    setIsPanningMode,
    handleZoomIn,
    handleZoomOut,
    handleZoomToFit,
    handleWheel,
    setStageScale,
    setStagePosition,
    zoomPercentage,
  } = useCanvasNavigation({
    stageRef: konvaStageRef,
    disablePanningToggleOnKey: editingTitle,
    initialScale: initialViewState.scale,
    initialPosition: initialViewState.position,
  });
  // UseRef for photo states to avoid canvas refreshes on state changes
  const photoStates = useRef({});

  // Update canvas position and scale when initialViewState changes
  useEffect(() => {
    if (
      (initialViewState.scale !== 1 ||
        initialViewState.position.x !== 0 ||
        initialViewState.position.y !== 0) &&
      !viewStateAppliedRef.current
    ) {
      console.log("Applying saved view state:", initialViewState);
      setStageScale(initialViewState.scale);
      setStagePosition(initialViewState.position);
      viewStateAppliedRef.current = true;

      // Debug log to confirm state was updated
      console.log(
        "After applying view state - scale:",
        stageScale,
        "position:",
        stagePosition
      );

      // Force refresh if needed by scheduling a microtask
      setTimeout(() => {
        console.log(
          "Delayed check - scale:",
          stageScale,
          "position:",
          stagePosition
        );
      }, 100);
    }
  }, [
    initialViewState,
    setStageScale,
    setStagePosition,
    stageScale,
    stagePosition,
  ]);

  // Update transformer when selection changes
  useEffect(() => {
    if (trRef.current && konvaStageRef.current) {
      if (selectedElement) {
        const node = konvaStageRef.current.findOne("#" + selectedElement.id);
        if (node) {
          trRef.current.nodes([node]);
          trRef.current.getLayer()?.batchDraw();
        }
      } else {
        trRef.current.nodes([]);
        trRef.current.getLayer()?.batchDraw();
      }
    }
  }, [selectedElement]);

  // Handle file upload with new state management
  const handleFileUpload = useCallback(
    async (e) => {
      const filesArray = Array.from(e.target.files);
      if (!filesArray || filesArray.length === 0) return;

      setIsUploading(true);
      setCurrentPhase("compressing");
      // Assuming single file upload for simplified status text,
      // but onProgress still receives multi-file info from memoryService
      const firstFile = filesArray[0];
      setUploadStatus(`Preparing ${firstFile.name}...`);
      setCurrentProgress(0);

      const onProgressCallback = (progress) => {
        console.log("Upload Progress:", progress);

        switch (progress.type) {
          case "compression_start":
            setCurrentPhase("compressing");
            // For single file focus, use the specific file name if available, else generic
            const compressingFileName =
              progress.fileName ||
              (filesArray.length > 0 ? filesArray[0].name : "file");
            setUploadStatus(`Compressing ${compressingFileName}...`);
            setCurrentProgress(
              filesArray.length > 1
                ? (progress.fileIndex / progress.totalFiles) * 100
                : 50 // Simulate some progress for single file
            );
            break;
          case "compression_end":
            setCurrentPhase("compressing"); // Still compressing until all_files_processed or upload_start
            const compressedFileName =
              progress.fileName ||
              (filesArray.length > 0 ? filesArray[0].name : "file");
            const originalSizeFormatted = formatBytes(progress.originalSize);
            const processedSizeFormatted = formatBytes(progress.processedSize);
            setUploadStatus(
              `Compressed ${compressedFileName}: ${originalSizeFormatted} → ${processedSizeFormatted}`
            );
            setCurrentProgress(
              filesArray.length > 1
                ? ((progress.fileIndex + 1) / progress.totalFiles) * 100
                : 100
            );
            break;
          case "all_files_processed":
            // This event implies compression is fully done for all files.
            // If only one file, compression_end already set progress to 100.
            // For multiple files, this confirms all are compressed.
            // The next natural step is upload_start.
            // No specific status change here, wait for upload_start.
            // setUploadStatus("All files processed. Preparing for upload...");
            // setCurrentProgress(100); // Compression part is 100% done
            break;
          case "upload_start":
            setCurrentPhase("uploading");
            setUploadStatus(
              `Uploading (${formatBytes(progress.totalSizeToUpload)})...`
            );
            setCurrentProgress(0);
            break;
          case "upload_complete":
            setCurrentPhase("loading_to_canvas");
            setUploadStatus(
              `Processing...` // Simplified message for loading to canvas
            );
            setCurrentProgress(50); // Indicate loading to canvas is a step

            (async () => {
              try {
                const newPhotosData = await Promise.all(
                  progress.responseData.map((photo) => {
                    return new Promise((resolve) => {
                      const img = new window.Image();
                      img.crossOrigin = "anonymous";
                      (async () => {
                        try {
                          const blob = await memoryService.getPhoto(
                            photo.id,
                            "N"
                          );
                          const objectURL = URL.createObjectURL(blob);
                          img.src = objectURL;
                          img.onload = () => {
                            photoStates.current[photo.id] = "N";
                            resolve({
                              ...photo,
                              image: img,
                              objectURL,
                              x: 50,
                              y: 50,
                              width: img.naturalWidth / 4,
                              height: img.naturalHeight / 4,
                              rotation: 0,
                              originalWidth: img.naturalWidth,
                              originalHeight: img.naturalHeight,
                              size: blob.size,
                            });
                          };
                          img.onerror = () => {
                            URL.revokeObjectURL(objectURL);
                            resolve(null);
                          };
                        } catch (err) {
                          console.error("Failed to load uploaded photo:", err);
                          resolve(null);
                        }
                      })();
                    });
                  })
                );
                setPhotos((prev) => [
                  ...prev,
                  ...newPhotosData.filter((p) => p !== null),
                ]);
                setSelectedElement(null);

                setCurrentPhase("completed");
                setUploadStatus("Photo added!");
                setCurrentProgress(100);
                toast({
                  title: "Photo Added",
                  description: `Successfully added to the canvas.`,
                  status: "success",
                  duration: 2000,
                  isClosable: true,
                });
              } catch (loadErr) {
                console.error("Error processing uploaded photos:", loadErr);
                setCurrentPhase("failed");
                setUploadStatus("Error displaying photo.");
                setCurrentProgress(100); // Mark as finished, but failed
                toast({
                  title: "Error after upload",
                  description:
                    "Photo uploaded, but failed to display it on canvas.",
                  status: "warning",
                  duration: 4000,
                  isClosable: true,
                });
              } finally {
                setTimeout(
                  () => {
                    setIsUploading(false);
                    setUploadStatus("");
                    setCurrentProgress(0);
                    setCurrentPhase("");
                  },
                  currentPhase === "failed" ? 4000 : 2000
                );
              }
            })();
            break;
          case "upload_error":
            setCurrentPhase("failed");
            setUploadStatus(
              `Upload error: ${progress.error.message.substring(0, 30)}...`
            );
            setCurrentProgress(100); // Mark as finished, but failed
            toast({
              title: "Upload Error",
              description: `Failed to upload photo(s): ${progress.error.message}`,
              status: "error",
              duration: 4000,
              isClosable: true,
            });
            setTimeout(() => {
              setIsUploading(false);
              setUploadStatus("");
              setCurrentProgress(0);
              setCurrentPhase("");
            }, 4000);
            break;
          default:
            break;
        }
      };

      try {
        // Pass only the first file if the UI is for single file,
        // though memoryService.uploadPhotos handles an array.
        // For this UI, we'll focus on the first file's info for status text.
        await memoryService.uploadPhotos(filesArray, onProgressCallback);
      } catch (err) {
        console.error("Outer Upload Error:", err);
        setCurrentPhase("failed");
        setUploadStatus(`Upload failed: ${err.message.substring(0, 30)}...`);
        setCurrentProgress(100); // Mark as finished, but failed
        toast({
          title: "Upload Initiation Error",
          description: `Failed to start photo upload: ${err.message}`,
          status: "error",
          duration: 4000,
          isClosable: true,
        });
        setTimeout(() => {
          setIsUploading(false);
          setUploadStatus("");
          setCurrentProgress(0);
          setCurrentPhase("");
        }, 4000);
      } finally {
        if (e.target) {
          e.target.value = "";
        }
      }
    },
    [toast, setPhotos, setSelectedElement] // Removed filesArray from dependencies
  );

  // Load memory and its photos
  useEffect(() => {
    const loadMemory = async () => {
      try {
        // Reset the viewStateApplied flag when loading a new memory
        viewStateAppliedRef.current = false;

        setLoading(true);
        const data = await memoryService.getMemory(id);
        setMemory(data);
        setTitle(data.title);

        // Clear any previous photoStates
        photoStates.current = {};

        // Create a map of photo configurations from canvas_config
        const photoConfigMap = {};
        if (
          data.canvas_config &&
          data.canvas_config.photos &&
          Array.isArray(data.canvas_config.photos)
        ) {
          data.canvas_config.photos.forEach((photoConfig) => {
            if (photoConfig.id) {
              photoConfigMap[photoConfig.id] = photoConfig;
            }
          });
        }

        console.log("Canvas config:", {
          hasCanvasConfig: !!data.canvas_config,
          hasPhotosArray: !!(data.canvas_config && data.canvas_config.photos),
          photoCount: data.canvas_config?.photos?.length || 0,
          configMap: photoConfigMap,
        });

        // Load existing photos (check both "P" and "N" states)
        if (data.photos && Array.isArray(data.photos)) {
          const loadedPhotos = await Promise.all(
            data.photos.map((photo) => {
              return new Promise((resolve) => {
                const img = new window.Image();
                img.crossOrigin = "anonymous";

                (async () => {
                  try {
                    // Try permanent storage first, then temp if needed
                    let blob;
                    let photoState = "P"; // Default to Persisted
                    try {
                      blob = await memoryService.getPhoto(photo.id, "P");
                    } catch (error) {
                      console.error(
                        "Failed to load from permanent storage:",
                        error
                      );
                      blob = await memoryService.getPhoto(photo.id, "N");
                      photoState = "N"; // If loaded from temp, it's New
                    }

                    // Store photo state in the ref object
                    photoStates.current[photo.id] = photoState;

                    const objectURL = URL.createObjectURL(blob);
                    img.src = objectURL;

                    img.onload = () => {
                      // Get photo configuration from the canvas_config if available
                      const photoConfig = photoConfigMap[photo.id] || {};
                      console.log(`Config for photo ${photo.id}:`, photoConfig);

                      // Use configuration values from canvas_config for position and display dimensions,
                      // while using the photo record for original dimensions and size
                      resolve({
                        ...photo,
                        image: img,
                        objectURL,
                        // Use canvas config positioning first, then fallback to defaults
                        x: photoConfig.x || 50,
                        y: photoConfig.y || 50,
                        width: photoConfig.width || img.naturalWidth / 4,
                        height: photoConfig.height || img.naturalHeight / 4,
                        rotation: photoConfig.rotation || 0,
                        // originalWidth and originalHeight come from the photo record now, with fallback to actual image dimensions
                        originalWidth: photo.originalWidth || img.naturalWidth,
                        originalHeight:
                          photo.originalHeight || img.naturalHeight,
                        size: photo.size || 0,
                      });
                    };

                    img.onerror = () => {
                      URL.revokeObjectURL(objectURL);
                      resolve(null);
                    };
                  } catch (err) {
                    console.error("Failed to load photo:", err);
                    resolve(null);
                  }
                })();
              });
            })
          );

          setPhotos(loadedPhotos.filter((p) => p !== null));
        }

        // Load texts
        if (data.canvas_config?.texts) {
          setTexts(
            data.canvas_config.texts.map((text) => ({
              ...text,
              id: String(
                text.id || `text-${Math.random().toString(36).substr(2, 9)}`
              ),
              type: "text",
              fontStyle: text.fontStyle || "normal",
              textDecoration: text.textDecoration || "",
              fontSize: Math.max(
                MIN_FONT_SIZE,
                Math.min(text.fontSize || 24, MAX_FONT_SIZE)
              ),
            }))
          );
        }

        // Load view state if available (zoom and pan position)
        if (data.canvas_config?.viewState) {
          console.log(
            "Restoring canvas view state:",
            data.canvas_config.viewState
          );
          setInitialViewState({
            scale: data.canvas_config.viewState.scale || 1,
            position: data.canvas_config.viewState.position || { x: 0, y: 0 },
          });
        }
      } catch (err) {
        setError(err.message);
        toast({
          title: "Error",
          description: `Failed to load memory: ${err.message}`,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    loadMemory();
  }, [id, toast]);

  // Clean up object URLs and clear selection on unmount
  useEffect(() => {
    return () => {
      photos.forEach((photo) => {
        if (photo.objectURL) {
          URL.revokeObjectURL(photo.objectURL);
        }
      });
      setSelectedElement(null);
    };
  }, [photos]);

  // Panning mode toggle handled by useCanvasNavigation hook

  // Zoom functions now handled by useCanvasNavigation hook

  // Handle fullscreen toggle
  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullScreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
    };
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        toast({
          title: "Fullscreen Error",
          description: `Could not enable fullscreen mode: ${err.message}`,
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Zoom functions now handled by useCanvasNavigation hook

  // Save just the title
  const saveTitle = useCallback(async () => {
    if (!memory) return;

    try {
      setSaving(true);
      await memoryService.updateMemoryTitle(memory.id, title);
      toast({
        title: "Success",
        description: "Title updated successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: "Save Error",
        description: `Failed to save title: ${err.message}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      // Revert to original title if save fails
      setTitle(memory.title);
    } finally {
      setSaving(false);
    }
  }, [memory, title, toast]);

  // Save memory with separate photo states management
  const saveMemoryLayout = useCallback(async () => {
    if (!memory) return;

    // Prepare photo data with all necessary rendering properties
    // The state information is passed separately in the photoStates object
    const photoData = photos.map((p) => {
      // Only send position and presentation data to the view configuration
      return {
        id: p.id,
        // state removed - it's now in photoStates.current[p.id]
        x: p.x,
        y: p.y,
        // These are the display dimensions (scaled)
        width: p.width,
        height: p.height,
        rotation: p.rotation || 0,
      };
    });

    const textData = texts.map((t) => ({
      id: t.id,
      x: t.x,
      y: t.y,
      text: t.text,
      fontSize: t.fontSize,
      fontFamily: t.fontFamily,
      fill: t.fill,
      rotation: t.rotation || 0,
      width: t.width,
      wrap: t.wrap,
      align: t.align,
      fontStyle: t.fontStyle,
      textDecoration: t.textDecoration,
    }));

    try {
      setSaving(true);
      // Combine the photos array (rendering data) with separate photoStates (persistence state)
      // into a payload for the server
      const updateData = {
        title,
        canvas: {
          photos: photoData, // Photos with rendering properties
          texts: textData,
          // Save current view state (zoom and pan position)
          viewState: {
            scale: stageScale,
            position: stagePosition,
          },
        },
        photoStates: photoStates.current, // Add the entire photoStates object separately
      };
      console.log("Sending update to backend:", {
        memoryId: memory.id,
        updateData: JSON.stringify({
          ...updateData,
          photoStates:
            JSON.stringify(photoStates.current).substring(0, 100) + "...", // Truncate for log readability
        }),
        photosCount: photoData.length,
        newPhotos: Object.values(photoStates.current).filter(
          (state) => state === "N"
        ).length,
      });

      await memoryService.updateMemory(memory.id, updateData);

      // Update photo states after successful save
      // All photos are now persisted
      // Log before update for debugging
      console.log("Photo states before update:", { ...photoStates.current });

      const updatedPhotoStates = { ...photoStates.current };
      photos.forEach((p) => {
        if (updatedPhotoStates[p.id] === "N") {
          // New photos become Persisted
          updatedPhotoStates[p.id] = "P";
        }
        // Remove any "R" (removed) states - they're gone after save
        if (updatedPhotoStates[p.id] === "R") {
          delete updatedPhotoStates[p.id];
        }
      });
      photoStates.current = updatedPhotoStates;

      // Log after update for debugging
      console.log("Photo states after update:", { ...photoStates.current });

      // Instead of reloading photos, just update the memory metadata
      // This prevents unnecessary canvas refreshes
      try {
        const updatedMemory = await memoryService.getMemory(memory.id);
        // Update only the memory metadata without triggering photo reloading
        setMemory((prevMemory) => ({
          ...updatedMemory,
          photos: prevMemory.photos, // Keep the current photo references
        }));
      } catch (error) {
        console.error("Failed to refresh memory metadata:", error);
        // Not critical, so we continue
      }

      toast({
        title: "Success",
        description: "Memory saved successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: "Save Error",
        description: `Failed to save memory: ${err.message}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  }, [memory, photos, texts, title, toast, stageScale, stagePosition]);

  // Handle photo deletion
  const handleDeletePhoto = useCallback(
    (photoToDelete) => {
      if (!photoToDelete) return;

      // Mark the photo as removed in photoStates
      photoStates.current[photoToDelete.id] = "R";

      // Clean up object URL to prevent memory leak
      if (photoToDelete.objectURL) {
        URL.revokeObjectURL(photoToDelete.objectURL);
      }

      // Remove the photo from the photos array
      setPhotos((prevPhotos) =>
        prevPhotos.filter((p) => p.id !== photoToDelete.id)
      );

      // Clear selection since we're removing the selected element
      setSelectedElement(null);

      toast({
        title: "Photo Removed",
        description: "Photo will be permanently removed when you save",
        status: "info",
        duration: 3000,
        isClosable: true,
      });
    },
    [toast]
  );

  // EditorControls component for the left toolbar
  const EditorControls = () => (
    <Flex
      direction="column"
      p={2}
      bg="gray.100"
      borderRight="1px solid"
      borderColor="gray.300"
      width="60px"
      alignItems="center"
      zIndex={1}
      position="absolute"
      top={0}
      left={0}
      bottom={0}
    >
      <Tooltip label="Select/Pan Tool" placement="right">
        <IconButton
          aria-label="Select/Pan Tool"
          icon={isPanningMode ? <FaHandPaper /> : <FaMousePointer />}
          onClick={() => {
            setActiveTool(activeTool === "pan" ? null : "pan");
            setIsPanningMode((prev) => !prev);
          }}
          colorScheme={activeTool === "pan" || isPanningMode ? "blue" : "gray"}
          variant={activeTool === "pan" || isPanningMode ? "solid" : "outline"}
          mb={2}
        />
      </Tooltip>
      <Tooltip label="Add Text" placement="right">
        <IconButton
          aria-label="Add Text"
          icon={<MdTextFields />}
          onClick={() => {
            setActiveTool("text");
            setIsPanningMode(false);
          }}
          colorScheme={activeTool === "text" ? "blue" : "gray"}
          variant={activeTool === "text" ? "solid" : "outline"}
          mb={2}
        />
      </Tooltip>
      <Box flexGrow={1} />
      <Tooltip label="Zoom In" placement="right">
        <IconButton
          icon={<FaSearchPlus />}
          onClick={handleZoomIn}
          aria-label="Zoom In"
          mb={1}
          variant="outline"
        />
      </Tooltip>

      {/* Zoom percentage display */}
      <Box
        mb={1}
        bg="transparent"
        px={1}
        py={0.5}
        fontSize="xs"
        fontWeight="medium"
        textAlign="center"
        width="100%"
        color="blue.500"
      >
        {zoomPercentage}%
      </Box>

      <Tooltip label="Zoom Out" placement="right">
        <IconButton
          icon={<FaSearchMinus />}
          onClick={handleZoomOut}
          aria-label="Zoom Out"
          mb={2}
          variant="outline"
        />
      </Tooltip>

      <Tooltip label="Zoom to Fit" placement="right">
        <IconButton
          icon={<FaExpandArrowsAlt />}
          onClick={() => handleZoomToFit([...photos, ...texts])}
          aria-label="Zoom to Fit"
          mb={2}
          variant="outline"
        />
      </Tooltip>
      <Tooltip
        label={isFullScreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        placement="right"
      >
        <IconButton
          icon={isFullScreen ? <FaCompressArrowsAlt /> : <FaExpandArrowsAlt />}
          onClick={toggleFullScreen}
          aria-label="Toggle Fullscreen"
          variant="outline"
          mb={2}
        />
      </Tooltip>
    </Flex>
  );

  if (loading) {
    return (
      <Flex
        direction="column"
        justify="center"
        align="center"
        height="100vh"
        bg="gray.50"
      >
        <Spinner
          thickness="4px"
          speed="0.65s"
          emptyColor="gray.200"
          color="blue.500"
          size="xl"
          mb={4}
        />
        <Text>Loading memory...</Text>
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex
        direction="column"
        justify="center"
        align="center"
        height="100vh"
        bg="gray.50"
        p={8}
      >
        <Text color="red.500" fontSize="xl" mb={4}>
          Error loading memory: {error}
        </Text>
        <Button onClick={() => navigate("/dashboard")} colorScheme="blue">
          Back to Dashboard
        </Button>
      </Flex>
    );
  }

  const currentStatusConfig = getStatusConfig(currentPhase);

  return (
    <ErrorBoundary>
      <Box h="100vh" display="flex" flexDirection="column">
        {/* Top Bar */}
        <Flex
          as="header"
          align="center"
          justify="space-between"
          p={2}
          bg="white"
          borderBottom="1px solid"
          borderColor="gray.200"
          h="60px"
        >
          <HStack spacing={3}>
            <Tooltip label="Back to Dashboard">
              <IconButton
                aria-label="Back to dashboard"
                icon={<ArrowBackIcon />}
                variant="ghost"
                onClick={() => navigate("/dashboard")}
              />
            </Tooltip>
            <Image src={LogoSvg} alt="Memora Logo" h="30px" />
          </HStack>

          {editingTitle ? (
            <Flex alignItems="center" flex="1" mx={4} maxW="500px">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                fontWeight="bold"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setEditingTitle(false);
                    saveTitle();
                  }
                  if (e.key === "Escape") {
                    setTitle(memory.title);
                    setEditingTitle(false);
                  }
                }}
                onBlur={() => {
                  setEditingTitle(false);
                  saveTitle();
                }}
                size="md"
                mr={2}
                bg="white"
              />
              <IconButton
                aria-label="Save Title"
                icon={<CheckIcon />}
                size="sm"
                onClick={() => {
                  setEditingTitle(false);
                  saveTitle();
                }}
                colorScheme="green"
              />
              <IconButton
                aria-label="Cancel Title Edit"
                icon={<CloseIcon />}
                size="sm"
                ml={2}
                onClick={() => {
                  setTitle(memory.title);
                  setEditingTitle(false);
                }}
                variant="ghost"
              />
            </Flex>
          ) : (
            <Flex
              alignItems="center"
              onClick={() => setEditingTitle(true)}
              cursor="pointer"
              mx={4}
              flex="1"
              minW="200px"
              justifyContent="center"
            >
              <Text fontSize="xl" fontWeight="bold" mr={2} noOfLines={1}>
                {title || "Untitled Memory"}
              </Text>
              <IconButton
                aria-label="Edit title"
                icon={<EditIcon />}
                size="xs"
                variant="ghost"
              />
            </Flex>
          )}

          <HStack spacing={2}>
            {isUploading ? (
              <HStack
                spacing={2}
                minW="250px"
                maxW="400px"
                mr={2}
                alignItems="center"
              >
                <Box color={currentStatusConfig.textColor} fontSize="xl">
                  {currentStatusConfig.icon}
                </Box>
                <Box flex="1">
                  <Text
                    fontSize="xs"
                    noOfLines={1}
                    title={uploadStatus}
                    mb={0.5}
                    textAlign="left"
                    color={currentStatusConfig.textColor}
                  >
                    {uploadStatus}
                  </Text>
                  <Progress
                    value={
                      currentPhase === "completed" || currentPhase === "failed"
                        ? 100
                        : currentPhase === "compressing"
                        ? currentProgress
                        : undefined
                    }
                    isIndeterminate={
                      currentPhase === "uploading" ||
                      currentPhase === "loading_to_canvas"
                    }
                    size="xs"
                    w="100%"
                    colorScheme={currentStatusConfig.colorScheme}
                    hasStripe={
                      currentPhase !== "completed" && currentPhase !== "failed"
                    }
                    isAnimated={
                      currentPhase !== "completed" && currentPhase !== "failed"
                    }
                    borderRadius="sm"
                  />
                </Box>
              </HStack>
            ) : (
              <Tooltip label="Upload Photos">
                <IconButton
                  aria-label="Upload Photos"
                  icon={<AttachmentIcon />}
                  onClick={() => fileInputRef.current?.click()}
                  size="md"
                  disabled={saving}
                />
              </Tooltip>
            )}

            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: "none" }}
              ref={fileInputRef}
              disabled={isUploading || saving} // Disable if an upload is in progress or layout saving
            />

            <Tooltip label="Save All Changes">
              <Button
                leftIcon={<FaSave />}
                onClick={saveMemoryLayout}
                colorScheme="green"
                size="md"
                isLoading={saving}
                disabled={saving || isUploading} // Disable if saving or uploading
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </Tooltip>

            <Menu>
              <MenuButton
                as={IconButton}
                icon={<FaEllipsisV />}
                variant="ghost"
                aria-label="More options"
                size="md"
              />
              <MenuList>
                <MenuItem isDisabled>Download (Not Implemented)</MenuItem>
                <MenuItem isDisabled>Share (Not Implemented)</MenuItem>
                <MenuItem
                  onClick={() => setPhotoToDelete(null)}
                  icon={<DeleteIcon />}
                >
                  Delete Memory
                </MenuItem>
              </MenuList>
            </Menu>

            <Menu>
              <MenuButton
                as={IconButton}
                icon={
                  <Avatar size="sm" name={user?.full_name || user?.username} />
                }
                variant="ghost"
                aria-label="User options"
                size="md"
                borderRadius="full"
              />
              <MenuList>
                <MenuItem onClick={() => navigate("/account-settings")}>
                  Account Settings
                </MenuItem>
                <MenuDivider />
                <MenuItem
                  color="red.500"
                  onClick={() => {
                    logout();
                    toast({
                      title: "Logged Out",
                      description: "You have been successfully logged out.",
                      status: "info",
                      duration: 3000,
                      isClosable: true,
                    });
                    navigate("/login");
                  }}
                >
                  Sign Out
                </MenuItem>
              </MenuList>
            </Menu>
          </HStack>
        </Flex>

        {/* Canvas Area */}
        <Box
          flex="1"
          position="relative"
          overflow="hidden"
          ref={stageContainerRef}
        >
          <EditorControls />
          <Stage
            width={window.innerWidth}
            height={window.innerHeight}
            ref={konvaStageRef}
            scaleX={stageScale}
            scaleY={stageScale}
            x={stagePosition.x}
            y={stagePosition.y}
            onWheel={handleWheel}
            draggable={isPanningMode}
            onClick={(e) => {
              const clickedOnEmpty = e.target === e.target.getStage();
              if (clickedOnEmpty) {
                setSelectedElement(null);
              }
            }}
          >
            <Layer>
              {photos.map((photo) => (
                <React.Fragment key={photo.id}>
                  <KonvaImage
                    id={photo.id}
                    image={photo.image}
                    x={photo.x}
                    y={photo.y}
                    width={photo.width}
                    height={photo.height}
                    rotation={photo.rotation}
                    draggable={!isPanningMode}
                    onClick={() => setSelectedElement(photo)}
                    onDragEnd={(e) => {
                      const node = e.target;
                      setPhotos((prev) =>
                        prev.map((p) =>
                          p.id === photo.id
                            ? {
                                ...p,
                                x: node.x(),
                                y: node.y(),
                              }
                            : p
                        )
                      );
                    }}
                  />
                  {selectedElement?.id === photo.id && (
                    <DeleteButton
                      x={photo.x + photo.width - 10}
                      y={photo.y - 15}
                      onClick={() => {
                        setPhotoToDelete(photo);
                        setIsDeleteDialogOpen(true);
                      }}
                    />
                  )}
                </React.Fragment>
              ))}
              {texts.map((text) => (
                <KonvaText
                  key={text.id}
                  id={text.id}
                  x={text.x}
                  y={text.y}
                  text={text.text}
                  fontSize={text.fontSize}
                  fontFamily={text.fontFamily}
                  fill={text.fill}
                  width={text.width}
                  rotation={text.rotation}
                  draggable={!isPanningMode}
                  onClick={() => setSelectedElement(text)}
                  onDragEnd={(e) => {
                    const node = e.target;
                    setTexts((prev) =>
                      prev.map((t) =>
                        t.id === text.id
                          ? {
                              ...t,
                              x: node.x(),
                              y: node.y(),
                            }
                          : t
                      )
                    );
                  }}
                />
              ))}
              <Transformer
                ref={trRef}
                boundBoxFunc={(oldBox, newBox) => {
                  // Limit minimum size
                  if (newBox.width < 5 || newBox.height < 5) {
                    return oldBox;
                  }
                  return newBox;
                }}
                onTransformEnd={(e) => {
                  // Update the selected element's position and size
                  const node = e.target;
                  if (!selectedElement) return;

                  const scaleX = node.scaleX();
                  const scaleY = node.scaleY();

                  // Always reset scale to 1 to avoid compounding scales
                  node.scaleX(1);
                  node.scaleY(1);

                  if (selectedElement.type === "text") {
                    // Handle text element transform
                    setTexts((prev) =>
                      prev.map((t) =>
                        t.id === selectedElement.id
                          ? {
                              ...t,
                              x: node.x(),
                              y: node.y(),
                              rotation: node.rotation(),
                              width: node.width() * scaleX,
                            }
                          : t
                      )
                    );
                  } else {
                    // Handle photo element transform
                    console.log("Transform completed:", {
                      id: selectedElement.id,
                      width: Math.round(node.width() * scaleX),
                      height: Math.round(node.height() * scaleY),
                      x: node.x(),
                      y: node.y(),
                      rotation: node.rotation(),
                    });

                    setPhotos((prev) =>
                      prev.map((p) =>
                        p.id === selectedElement.id
                          ? {
                              ...p,
                              x: node.x(),
                              y: node.y(),
                              width: Math.round(node.width() * scaleX),
                              height: Math.round(node.height() * scaleY),
                              rotation: node.rotation(),
                            }
                          : p
                      )
                    );
                  }
                }}
              />
            </Layer>
          </Stage>
        </Box>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          isOpen={isDeleteDialogOpen}
          leastDestructiveRef={cancelRef}
          onClose={() => setIsDeleteDialogOpen(false)}
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Delete Photo
              </AlertDialogHeader>
              <AlertDialogBody>
                Are you sure you want to delete this photo? This action cannot
                be undone.
              </AlertDialogBody>
              <AlertDialogFooter>
                <Button
                  ref={cancelRef}
                  onClick={() => setIsDeleteDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  colorScheme="red"
                  onClick={() => {
                    handleDeletePhoto(photoToDelete);
                    setIsDeleteDialogOpen(false);
                  }}
                  ml={3}
                >
                  Delete
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </Box>
    </ErrorBoundary>
  );
};

export default MemoryEditorPage;
