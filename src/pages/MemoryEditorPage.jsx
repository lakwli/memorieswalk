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
import { FaSave, FaEllipsisV, FaSearchPlus, FaSearchMinus, FaExpandArrowsAlt, FaCompressArrowsAlt, FaMousePointer, FaHandPaper } from "react-icons/fa";
import { MdTextFields } from "react-icons/md";
import {
  ArrowBackIcon,
  EditIcon,
  CheckIcon,
  CloseIcon,
  AttachmentIcon,
  DeleteIcon,
} from "@chakra-ui/icons";
import { useAuth } from "../context/AuthContext";
import LogoSvg from "../assets/logo.svg";
import memoryService from "../services/memoryService";
import ErrorBoundary from "../components/ErrorBoundary";
import useCanvasNavigation from "./MemoryEditorPage/hooks/useCanvasNavigation";

const MIN_FONT_SIZE = 8;
const MAX_FONT_SIZE = 144;

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

  const stageContainerRef = useRef(null);
  const konvaStageRef = useRef(null);
  const fileInputRef = useRef(null);
  const trRef = useRef(null);
  
  // Use custom navigation hook for canvas zoom and pan
  const {
    stageScale,
    stagePosition,
    isPanningMode,
    setIsPanningMode,
    handleZoomIn,
    handleZoomOut,
    handleZoomToFit,
    handleWheel
  } = useCanvasNavigation({
    stageRef: konvaStageRef,
    disablePanningToggleOnKey: editingTitle
  });
  // UseRef for photo states to avoid canvas refreshes on state changes
  const photoStates = useRef({});

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
      const files = e.target.files;
      if (!files || files.length === 0) return;

      try {
        const uploadedPhotos = await memoryService.uploadPhotos(files);

        // Load the newly uploaded photos
        const newPhotos = await Promise.all(
          uploadedPhotos.map((photo) => {
            return new Promise((resolve) => {
              const img = new window.Image();
              img.crossOrigin = "anonymous";

              (async () => {
                try {
                  const blob = await memoryService.getPhoto(photo.id, "N");
                  const objectURL = URL.createObjectURL(blob);
                  img.src = objectURL;

                  img.onload = () => {
                    // Store state in photoStates ref instead of the photo object itself
                    photoStates.current[photo.id] = "N"; // New photo state

                    resolve({
                      ...photo,
                      image: img,
                      objectURL,
                      x: 50,
                      y: 50,
                      width: img.naturalWidth / 4,
                      height: img.naturalHeight / 4,
                      rotation: 0,
                      // No isNew flag - use photoStates.current[id] === "N" instead
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
                  console.error("Failed to load photo:", err);
                  resolve(null);
                }
              })();
            });
          })
        );

        setPhotos((prev) => [...prev, ...newPhotos.filter((p) => p !== null)]);
        setSelectedElement(null); // Clear selection when adding new photos

        toast({
          title: "Photos Uploaded",
          description: `Successfully uploaded ${uploadedPhotos.length} photos`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } catch (err) {
        toast({
          title: "Upload Error",
          description: `Failed to upload photos: ${err.message}`,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } finally {
        e.target.value = "";
      }
    },
    [toast]
  );

  // Load memory and its photos
  useEffect(() => {
    const loadMemory = async () => {
      try {
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
  }, [memory, photos, texts, title, toast]);

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
          mb={2}
          variant="outline"
        />
      </Tooltip>
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
            <Tooltip label="Upload Photos">
              <IconButton
                aria-label="Upload Photos"
                icon={<AttachmentIcon />}
                onClick={() => fileInputRef.current?.click()}
                size="md"
              />
            </Tooltip>

            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: "none" }}
              ref={fileInputRef}
            />

            <Tooltip label="Save All Changes">
              <Button
                leftIcon={<FaSave />}
                onClick={saveMemoryLayout}
                colorScheme="green"
                size="md"
                isLoading={saving}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </Tooltip>

            <Tooltip label="Zoom In">
              <IconButton
                aria-label="Zoom In"
                icon={<FaSearchPlus />}
                onClick={handleZoomIn}
                size="md"
              />
            </Tooltip>

            <Tooltip label="Zoom Out">
              <IconButton
                aria-label="Zoom Out"
                icon={<FaSearchMinus />}
                onClick={handleZoomOut}
                size="md"
              />
            </Tooltip>

            <Tooltip label="Zoom to Fit">
              <IconButton
                aria-label="Zoom to Fit"
                icon={<FaExpandArrowsAlt />}
                onClick={() => handleZoomToFit([...photos, ...texts])}
                size="md"
              />
            </Tooltip>

            <Tooltip label={isFullScreen ? "Exit Fullscreen" : "Fullscreen"}>
              <IconButton
                aria-label="Fullscreen Toggle"
                icon={
                  isFullScreen ? <FaCompressArrowsAlt /> : <FaExpandArrowsAlt />
                }
                onClick={toggleFullScreen}
                size="md"
              />
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
