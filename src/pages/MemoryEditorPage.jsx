// ============================================================================
// REFACTORED MEMORY EDITOR COMPONENT
// ============================================================================

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Stage, Layer, Transformer } from "react-konva";
import {
  useToast,
  Box,
  Flex,
  Text,
  Button,
  Spinner,
  HStack,
  IconButton,
  Input,
  Image,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Tooltip,
  Avatar,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Progress,
} from "@chakra-ui/react";
import {
  FaSave,
  FaEllipsisV,
  FaSearchPlus,
  FaSearchMinus,
  FaExpandArrowsAlt,
  FaCompressArrowsAlt,
} from "react-icons/fa";
import { MdTextFields } from "react-icons/md";
import {
  ArrowBackIcon,
  EditIcon,
  CheckIcon,
  CloseIcon,
  AttachmentIcon,
  DeleteIcon,
} from "@chakra-ui/icons";

// Import our new element system
import {
  useCanvasElements,
  useElementBehaviors,
  useCanvasNavigation,
  useUploadManager,
} from "../hooks";
import { PhotoElement, TextElement } from "../components/canvas/elements";
import { ElementRenderer } from "../components/canvas/renderers";
import { ELEMENT_TYPES, ELEMENT_STATES } from "../constants";
import { useAuth } from "../context/AuthContext";
import memoryService from "../services/memoryService";
import LogoSvg from "../assets/logo.svg";
import ErrorBoundary from "../components/ErrorBoundary";

const MemoryEditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user, logout } = useAuth();

  // Replace separate photo/text states with unified element management
  const {
    elements,
    setElements,
    selectedElement,
    setSelectedElement,
    elementStates, // This replaces photoStates.current
    addElement,
    removeElement,
    updateElement,
    getElementsByType,
  } = useCanvasElements();

  // Get element behaviors
  const elementBehaviors = useElementBehaviors(
    elements,
    setElements,
    selectedElement,
    setSelectedElement
  );

  // Other existing state...
  const [memory, setMemory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [title, setTitle] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [activeTool, setActiveTool] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Refs...
  const konvaStageRef = useRef(null);
  const trRef = useRef(null);
  const cancelRef = useRef();
  const stageContainerRef = useRef(null);

  // State to store initial canvas view settings from server
  const [initialViewState, setInitialViewState] = useState({
    scale: 1,
    position: { x: 0, y: 0 },
  });

  // Ref to track if we've applied the view state
  const viewStateAppliedRef = useRef(false);

  // Canvas navigation hook
  const {
    stageScale,
    stagePosition,
    handleZoomIn,
    handleZoomOut,
    handleZoomToFit,
    handleWheel,
    setStageScale,
    setStagePosition,
    zoomPercentage,
    handleStageMouseDown,
    handleStageMouseMove,
    handleStageMouseUp,
  } = useCanvasNavigation({
    stageRef: konvaStageRef,
    initialScale: initialViewState.scale,
    initialPosition: initialViewState.position,
    activeTool: activeTool,
  });

  // Upload Manager hook
  const {
    isUploading,
    uploadStatus,
    currentProgress,
    currentPhase,
    handleFileUpload,
    triggerPhotoUpload,
    fileInputRef,
  } = useUploadManager({
    onPhotoAdded: (photoElements) => {
      setElements((prev) => [...prev, ...photoElements]);
      setSelectedElement(null);
    },
    onUploadStateChange: (state) => {
      // Optional: handle upload state changes if needed
      console.log("Upload state changed:", state);
    },
    canvasConfig: {
      stageRef: konvaStageRef,
      stageScale,
      stagePosition,
    },
    elementStates,
  });

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

  // Cursor management based on current tool
  useEffect(() => {
    if (stageContainerRef.current) {
      if (activeTool === "text") {
        stageContainerRef.current.style.cursor = "text";
      } else {
        // Default cursor for empty space should be "grab" (hand) to indicate draggable canvas
        // When spacebar is held (activeTool === "pan"), it becomes "grab"
        stageContainerRef.current.style.cursor = "grab";
      }
    }
  }, [activeTool]);

  // Keyboard event handling for tool switching
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === " " && !editingTitle) {
        e.preventDefault();
        if (activeTool !== "pan") {
          console.log("Setting activeTool to 'pan'");
          setActiveTool("pan");
        }
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === " " && !editingTitle) {
        e.preventDefault();
        console.log("Setting activeTool to null");
        setActiveTool(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [editingTitle, activeTool]);

  // Load memory with new element system
  useEffect(() => {
    const loadMemory = async () => {
      try {
        setLoading(true);
        const data = await memoryService.getMemory(id);
        setMemory(data);
        setTitle(data.title);

        // Clear previous element states
        elementStates.current = {};

        // Create photo element configuration map
        const photoConfigMap = {};
        if (data.canvas_config?.photos) {
          data.canvas_config.photos.forEach((photoConfig) => {
            if (photoConfig.id) {
              photoConfigMap[photoConfig.id] = photoConfig;
            }
          });
        }

        const loadedElements = [];

        // Load photos as PhotoElements
        if (data.photos && Array.isArray(data.photos)) {
          const photoElements = await Promise.all(
            data.photos.map(async (photo) => {
              try {
                let blob;
                let photoState = ELEMENT_STATES.PERSISTED;
                try {
                  // Try to load as persisted photo first
                  blob = await memoryService.getPhoto(
                    photo.id,
                    ELEMENT_STATES.PERSISTED
                  );
                } catch {
                  // Fallback to temporary photo
                  blob = await memoryService.getPhoto(
                    photo.id,
                    ELEMENT_STATES.NEW
                  );
                  photoState = ELEMENT_STATES.NEW;
                }

                elementStates.current[photo.id] = photoState;

                const objectURL = URL.createObjectURL(blob);
                const img = new window.Image();
                img.crossOrigin = "anonymous";
                img.src = objectURL;

                return new Promise((resolve) => {
                  img.onload = () => {
                    const photoConfig = photoConfigMap[photo.id] || {};

                    // Use saved position if available, otherwise use fixed fallback position
                    const fallbackPosition = { x: 100, y: 100 };

                    const photoElement = new PhotoElement({
                      ...photo,
                      image: img,
                      objectURL,
                      x:
                        photoConfig.x !== undefined
                          ? photoConfig.x
                          : fallbackPosition.x,
                      y:
                        photoConfig.y !== undefined
                          ? photoConfig.y
                          : fallbackPosition.y,
                      width: photoConfig.width || img.naturalWidth / 4,
                      height: photoConfig.height || img.naturalHeight / 4,
                      rotation: photoConfig.rotation || 0,
                      originalWidth: photo.originalWidth || img.naturalWidth,
                      originalHeight: photo.originalHeight || img.naturalHeight,
                      size: photo.size || 0,
                    });
                    resolve(photoElement);
                  };
                  img.onerror = () => {
                    URL.revokeObjectURL(objectURL);
                    resolve(null);
                  };
                });
              } catch (err) {
                console.error("Failed to load photo:", err);
                return null;
              }
            })
          );

          loadedElements.push(...photoElements.filter((p) => p !== null));
        }

        // Load texts as TextElements
        if (data.canvas_config?.texts) {
          const textElements = data.canvas_config.texts.map((text) => {
            const textElement = new TextElement({
              ...text,
              id: String(
                text.id || `text-${Math.random().toString(36).substr(2, 9)}`
              ),
            });

            // ALL elements MUST have state - assign PERSISTED to loaded text elements
            elementStates.current[textElement.id] = ELEMENT_STATES.PERSISTED;
          });
          loadedElements.push(...textElements);
        }

        // Set all elements at once
        setElements(loadedElements);

        // Load view state
        if (data.canvas_config?.viewState) {
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
  }, [id, toast, setElements, elementStates]);

  // Refactored save function
  const saveMemoryLayout = useCallback(async () => {
    if (!memory) return;

    // Separate photos and texts from elements
    const photoElements = getElementsByType(ELEMENT_TYPES.PHOTO);
    const textElements = getElementsByType(ELEMENT_TYPES.TEXT);

    const photoData = photoElements.map((photo) => photo.toSaveData());
    const textData = textElements.map((text) => text.toSaveData());

    try {
      setSaving(true);
      const updateData = {
        title,
        canvas: {
          photos: photoData,
          texts: textData,
          viewState: {
            scale: stageScale,
            position: stagePosition,
          },
        },
        photoStates: elementStates.current,
      };

      await memoryService.updateMemory(memory.id, updateData);

      // Update element states after successful save
      const updatedElementStates = { ...elementStates.current };

      // Apply state transitions to ALL elements (all elements have states)
      Object.keys(updatedElementStates).forEach((elementId) => {
        if (updatedElementStates[elementId] === ELEMENT_STATES.NEW) {
          updatedElementStates[elementId] = ELEMENT_STATES.PERSISTED;
        }
        if (updatedElementStates[elementId] === ELEMENT_STATES.REMOVED) {
          delete updatedElementStates[elementId];
        }
      });

      elementStates.current = updatedElementStates;

      // Refresh memory metadata
      try {
        const updatedMemory = await memoryService.getMemory(memory.id);
        setMemory((prevMemory) => ({
          ...updatedMemory,
          photos: prevMemory.photos,
        }));
      } catch (error) {
        console.error("Failed to refresh memory metadata:", error);
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
  }, [
    memory,
    getElementsByType,
    title,
    toast,
    stageScale,
    stagePosition,
    elementStates,
  ]);

  // Add text element function
  const addTextElement = useCallback(() => {
    // Calculate visible viewport center for text positioning
    const stage = konvaStageRef.current;
    let textX = 200;
    let textY = 200;

    if (stage) {
      const stageWidth = stage.width();
      const stageHeight = stage.height();
      const currentScale = stageScale;
      const currentPosition = stagePosition;

      // Calculate center of current viewport in canvas coordinates
      textX = (-currentPosition.x + stageWidth / 2) / currentScale;
      textY = (-currentPosition.y + stageHeight / 2) / currentScale;
    }

    const textElement = addElement(ELEMENT_TYPES.TEXT, {
      x: textX,
      y: textY,
      text: "New Text",
      fontSize: 24,
      fontFamily: "Arial",
      fill: "#000000",
    });
    setSelectedElement(textElement);
    setActiveTool(null);
  }, [
    addElement,
    setSelectedElement,
    stageScale,
    stagePosition,
    konvaStageRef,
  ]);

  // Handle stage click for adding text elements
  const handleStageClick = useCallback(
    (e) => {
      // Don't handle clicks if we're in pan mode or just finished dragging
      if (activeTool === "pan") return;

      if (e.target === e.target.getStage()) {
        if (activeTool === "text") {
          const stage = konvaStageRef.current;
          const pointer = stage.getPointerPosition();
          if (!pointer) return;

          // Convert screen coordinates to world coordinates
          const worldX = (pointer.x - stagePosition.x) / stageScale;
          const worldY = (pointer.y - stagePosition.y) / stageScale;

          const newTextElement = addElement(ELEMENT_TYPES.TEXT, {
            x: worldX,
            y: worldY,
            text: "New Text",
            fontSize: 24,
            fontFamily: "Arial",
            fill: "#000000",
          });
          setSelectedElement(newTextElement);
          setActiveTool(null);
        } else {
          // Clear selection when clicking on empty space
          setSelectedElement(null);
        }
      }
    },
    [
      activeTool,
      addElement,
      setSelectedElement,
      stagePosition.x,
      stagePosition.y,
      stageScale,
    ]
  );

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

  // Clean up object URLs and clear selection on unmount
  useEffect(() => {
    return () => {
      getElementsByType(ELEMENT_TYPES.PHOTO).forEach((photo) => {
        if (photo.objectURL) {
          URL.revokeObjectURL(photo.objectURL);
        }
      });
      setSelectedElement(null);
    };
  }, [getElementsByType, setSelectedElement]);

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

  const handleTitleSave = () => {
    if (title.trim() === "") {
      setTitle(memory.title);
      setEditingTitle(false);
      return;
    }
    if (title !== memory.title) {
      saveTitle();
    }
    setEditingTitle(false);
  };

  // EditorTopBar component
  const EditorTopBar = () => (
    <Flex
      as="header"
      align="center"
      justify="space-between"
      p={2}
      bg="white"
      borderBottom="1px solid"
      borderColor="gray.300"
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
              if (e.key === "Enter") handleTitleSave();
              if (e.key === "Escape") {
                setTitle(memory.title);
                setEditingTitle(false);
              }
            }}
            onBlur={handleTitleSave}
            size="md"
            mr={2}
            bg="white"
          />
          <IconButton
            aria-label="Save Title"
            icon={<CheckIcon />}
            size="sm"
            onClick={handleTitleSave}
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
          <Box minW="200px">
            <Text fontSize="sm" color="gray.600" mb={1}>
              {uploadStatus}
            </Text>
            <Progress
              value={currentProgress}
              colorScheme={
                currentPhase === "failed"
                  ? "red"
                  : currentPhase === "completed"
                  ? "green"
                  : currentPhase === "uploading"
                  ? "purple"
                  : "blue"
              }
              size="sm"
            />
          </Box>
        ) : (
          <Tooltip label="Upload Photos">
            <IconButton
              aria-label="Upload Photos"
              icon={<AttachmentIcon />}
              onClick={triggerPhotoUpload}
              size="md"
            />
          </Tooltip>
        )}
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
              onClick={() => {
                setIsDeleteDialogOpen(true);
              }}
              icon={<DeleteIcon />}
            >
              Delete Memory
            </MenuItem>
          </MenuList>
        </Menu>

        <Menu>
          <MenuButton
            as={IconButton}
            icon={<Avatar size="sm" name={user?.full_name || user?.username} />}
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
      height="100%"
    >
      <Tooltip label="Add Text" placement="right">
        <IconButton
          aria-label="Add Text"
          icon={<MdTextFields />}
          onClick={addTextElement}
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
          onClick={() => handleZoomToFit(elements)}
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

  // Loading state
  if (loading) {
    return (
      <Flex justify="center" align="center" height="100vh" bg="gray.50">
        <Spinner
          thickness="4px"
          speed="0.65s"
          emptyColor="gray.200"
          color="blue.500"
          size="xl"
        />
      </Flex>
    );
  }

  // Error state
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
      <Flex direction="column" height="100vh" bg="gray.50">
        <EditorTopBar />
        <Flex flex="1" overflow="hidden">
          <EditorControls />
          <Box
            ref={stageContainerRef}
            flex="1"
            position="relative"
            bg="gray.200"
            overflow="hidden"
            onDrop={(e) => {
              e.preventDefault();
              if (
                activeTool === "text" &&
                e.dataTransfer.types.includes("text/plain")
              ) {
                const droppedText = e.dataTransfer.getData("text/plain");
                const stage = konvaStageRef.current;
                const dropPosition = stage.getPointerPosition() || {
                  x: 50,
                  y: 50,
                };

                const newTextElement = addElement(ELEMENT_TYPES.TEXT, {
                  x: dropPosition.x,
                  y: dropPosition.y,
                  text: droppedText,
                  fontSize: 24,
                  fontFamily: "Arial",
                  fill: "#000000",
                });
                setSelectedElement(newTextElement);
                setActiveTool(null);
              }
            }}
            onDragOver={(e) => e.preventDefault()}
          >
            <Stage
              ref={konvaStageRef}
              width={window.innerWidth - 60}
              height={window.innerHeight - 120} // Account for top bar height (60px)
              scaleX={stageScale}
              scaleY={stageScale}
              x={stagePosition.x}
              y={stagePosition.y}
              onWheel={handleWheel}
              onMouseDown={handleStageMouseDown}
              onMouseMove={handleStageMouseMove}
              onMouseUp={handleStageMouseUp}
              onClick={handleStageClick}
            >
              <Layer>
                {elements.map((element) => (
                  <ElementRenderer
                    key={element.id}
                    element={element}
                    isSelected={selectedElement?.id === element.id}
                    onSelect={() => setSelectedElement(element)}
                    onUpdate={(updates) => updateElement(element.id, updates)}
                    onDelete={(element) => removeElement(element.id)}
                    behaviors={elementBehaviors}
                  />
                ))}
                <Transformer
                  ref={trRef}
                  boundBoxFunc={(oldBox, newBox) => {
                    if (newBox.width < 10 || newBox.height < 10) {
                      return oldBox;
                    }
                    return newBox;
                  }}
                  onTransformEnd={(e) => {
                    if (selectedElement) {
                      elementBehaviors.handleElementTransform(selectedElement)(
                        e
                      );
                    }
                  }}
                />
              </Layer>
            </Stage>
          </Box>
        </Flex>
      </Flex>

      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept="image/*"
        multiple
        onChange={handleFileUpload}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog
        isOpen={isDeleteDialogOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => setIsDeleteDialogOpen(false)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Memory
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete this memory? This cannot be
              undone.
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
                onClick={async () => {
                  try {
                    await memoryService.deleteMemory(id);
                    toast({
                      title: "Deleted",
                      description: "Memory deleted successfully",
                      status: "success",
                      duration: 3000,
                      isClosable: true,
                    });
                    navigate("/dashboard");
                  } catch (err) {
                    toast({
                      title: "Error",
                      description: `Failed to delete memory: ${err.message}`,
                      status: "error",
                      duration: 5000,
                      isClosable: true,
                    });
                  }
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
    </ErrorBoundary>
  );
};

export default MemoryEditorPage;
