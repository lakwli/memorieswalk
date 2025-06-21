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
  useCanvasNavigation,
  useUploadManager,
} from "../hooks";
import elementBehaviors from "../hooks/useElementBehaviors";
// Import new toolbar system
import { ElementToolbar } from "../components/canvas/toolbars";
//import { TextElement } from "../components/canvas/elements";
import { RendererFactory } from "../components/canvas/renderers/RendererFactory";
import { ELEMENT_TYPES, ELEMENT_STATES } from "../constants";
import { useAuth } from "../context/AuthContext";
import memoryService from "../services/memoryService";
import LogoSvg from "../assets/logo.svg";
import ErrorBoundary from "../components/ErrorBoundary";
import ConfirmationDialog from "../components/ConfirmationDialog";
import { canvasUtils } from "../utils/canvasUtils";
import { photoUtils } from "../utils/photoUtils";

const MemoryEditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user, logout } = useAuth();
  const rendererCacheRef = useRef(new Map());

  // Replace separate photo/text states with unified element management
  const {
    elements,
    setElements,
    setNewSelectedElement,
    selectedElement,
    editingElement,
    editingManager,
    elementStates, // This replaces photoStates.current
    createElement,
    removeElement, // Add removeElement to handle proper deletion
    updateElement,
    getElementsByType,
  } = useCanvasElements();

  // Other existing state...
  const [memory, setMemory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [title, setTitle] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
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

  // Canvas navigation hook with proper drag handler for panning
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
    handleStageDragStart,
    handleStageDragEnd,
  } = useCanvasNavigation({
    stageRef: konvaStageRef,
    initialScale: initialViewState.scale,
    initialPosition: initialViewState.position,
  });

  const {
    isUploading,
    uploadStatus,
    currentProgress,
    currentPhase,
    handleFileUpload,
    triggerPhotoUpload,
    fileInputRef,
  } = useUploadManager({
    onUploadComplete: (imageDataArray) => {
      addPhotoElementsIntoCanvas(imageDataArray);
    },
  });

  useEffect(() => {
    if (!trRef.current || !konvaStageRef.current) return;

    // Clear transformer
    trRef.current.nodes([]);

    // Show transformer only if element selected and not editing
    if (
      selectedElement &&
      !editingManager.isElementEditing(selectedElement.id)
    ) {
      const konvaNode = konvaStageRef.current.findOne(`#${selectedElement.id}`);
      if (konvaNode) {
        trRef.current.nodes([konvaNode]);
      }
    }

    trRef.current.getLayer()?.batchDraw();
  }, [selectedElement, editingManager]);

  // Update the element deletion handler
  // In MemoryEditorPage.jsx
  const handleElementDelete = useCallback(
    (elementId) => {
      console.log(`🗑️ [USER] Deleting element: ${elementId}`);

      // 1. Clean up renderer cache first
      if (rendererCacheRef.current) {
        const keysToRemove = [];
        for (const key of rendererCacheRef.current.keys()) {
          if (key.startsWith(elementId + "-")) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((key) => {
          //console.log(`🧹 Removing cached renderer: ${key}`);
          rendererCacheRef.current.delete(key);
        });
        //console.log(`🧹 Cache cleanup completed for: ${elementId}`);
      }

      // 2. Remove element from state
      removeElement(elementId);

      // console.log(`✅ Element deletion completed: ${elementId}`);
    },
    [removeElement]
  );

  // Private method to handle element selection changes
  const handleElementSelection = useCallback(
    (newElement) => {
      const previousElement = selectedElement;
      const previousId = previousElement?.id || null;
      const newId = newElement?.id || null;

      // Do nothing if selection hasn't changed
      if (previousId === newId) {
        //console.log("🔍 Selection unchanged, skipping:", newId);
        return;
      }

      console.log("🔍 [SELECT]:", { from: previousId, to: newId });

      // End any current editing session
      if (editingManager.editingElement) {
        editingManager.endEditing();
      }

      // Update React state
      setNewSelectedElement(newElement);
    },
    [editingManager, setNewSelectedElement, selectedElement] // ← Add updateTransformer
  );

  const handleStageClick = useCallback(
    (e) => {
      const clickedNode = e.target;
      const stage = e.target.getStage();

      if (clickedNode === stage) {
        console.log("🔍 [Click] Detect Click On Stage");
        handleElementSelection(null);
      } else {
        // Walk up to find element ID
        let currentNode = clickedNode;
        let elementId = null;

        while (currentNode && currentNode !== stage) {
          const nodeId = currentNode.id();
          if (nodeId && elements.find((el) => el.id === nodeId)) {
            elementId = nodeId;
            break;
          }
          currentNode = currentNode.getParent();
        }

        if (elementId) {
          const foundElement = elements.find((el) => el.id === elementId);
          if (foundElement) {
            console.log(
              `🔍 [Click] Detect Click On Element ${foundElement.id}`
            );
            // Use centralized selection handler
            handleElementSelection(foundElement);
          }
        } else {
          // No element found - clear selection
          handleElementSelection(null);
        }
      }
    },
    [elements, handleElementSelection]
  );

  // Simplified cursor management - always use grab cursor for canvas
  useEffect(() => {
    if (stageContainerRef.current) {
      // Default cursor for empty space should be "grab" (hand) to indicate draggable canvas
      stageContainerRef.current.style.cursor = "grab";
    }
  }, []);

  // Load memory with new element system
  useEffect(() => {
    console.log("🔵 [DB] Retrive Memory. Triggered with useEffect #3");
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

                    // Use PhotoTool to create the photo element
                    const photoElement =
                      elementBehaviors.createPhotoElementFromData(
                        photo,
                        photoConfig,
                        img,
                        objectURL
                      );
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
            const textElement = elementBehaviors.createTextElementFromData({
              ...text,
            });

            // ALL elements MUST have state - assign PERSISTED to loaded text elements
            elementStates.current[textElement.id] = ELEMENT_STATES.PERSISTED;
            return textElement;
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
  }, []); //ignore the elementbeahvors. if add it it will refresh the whole screen

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

  // ✅ Photo creation handler (follows addTextElementIntoCanvas pattern)
  const addPhotoElementsIntoCanvas = useCallback(
    async (imageDataArray) => {
      console.log("🚀 ===== STARTING PHOTO ELEMENT CREATION =====");

      try {
        const {
          width: canvasWidth,
          height: canvasHeight,
          //source,
        } = canvasUtils.getCanvasDimensions(konvaStageRef, stageContainerRef);
        /**
        console.log("🚀 Canvas dimensions:", {
          canvasWidth,
          canvasHeight,
          source,
        });
 */
        for (const imageData of imageDataArray) {
          // console.log("🚀 Creating photo element for:", imageData.fileName);

          // ✅ Calculate size explicitly here (single source of truth)
          const displaySize = photoUtils.calculateDisplaySize(
            imageData.originalWidth,
            imageData.originalHeight,
            canvasWidth,
            canvasHeight
          );
          /**
          console.log("🚀 Smart photo sizing:", {
            original: {
              width: imageData.originalWidth,
              height: imageData.originalHeight,
            },
            calculated: {
              width: displaySize.width,
              height: displaySize.height,
            },
            scale: `${Math.round(displaySize.scale * 100)}%`,
            reason: displaySize.reason,
          });
 */
          // Create PhotoElement with smart sizing
          const photoElement = createElement(ELEMENT_TYPES.PHOTO, {
            ...imageData,
            width: displaySize.width,
            height: displaySize.height,
          });

          /**    console.log("🚀 Created photo element:", {
            id: photoElement.id,
            size: { width: photoElement.width, height: photoElement.height },
          });
 */
          // Step 4: Position using elementBehaviors (same as text)
          elementBehaviors.addElementIntoCanvas(photoElement, konvaStageRef);
          //console.log("🚀 Positioned photo in canvas center");

          // Step 6: Set selection and toolbar (same as text) - for last uploaded photo
          setNewSelectedElement(photoElement);
          //setToolbarElementId(photoElement.id);
          //console.log("🚀 Selected photo:", photoElement.id);
        }

        // console.log("🚀 ===== PHOTO ELEMENT CREATION COMPLETED =====");
      } catch (error) {
        console.error("🚨 Photo element creation failed:", error);
        toast({
          title: "Error",
          description: `Failed to create photo elements: ${error.message}`,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    },
    [createElement, konvaStageRef, setNewSelectedElement, toast]
  );

  const addTextElementIntoCanvas = useCallback(() => {
    const textElement = createElement(ELEMENT_TYPES.TEXT);

    elementBehaviors.addElementIntoCanvas(textElement, konvaStageRef);
    setNewSelectedElement(textElement);
    //handleElementSelection(textElement);
  }, [konvaStageRef, createElement, setNewSelectedElement]);

  // Handle editing mode transitions using central editing manager
  const handleElementEdit = useCallback(
    (shouldEdit) => {
      if (shouldEdit && selectedElement) {
        editingManager.startEditing(selectedElement); // ← Direct from useCanvasElements
      } else {
        editingManager.endEditing(); // ← Direct from useCanvasElements
      }
    },
    [selectedElement, editingManager] // ← Use editingManager directly, NOT from elementBehaviors
  );

  // Handle finishing edit mode (for future use)
  // const handleElementFinishEdit = useCallback(() => {
  //   elementBehaviors.editingManager.endEditing();
  // }, [elementBehaviors.editingManager]);

  // Handle element updates from toolbar with editing awareness - SIMPLIFIED VERSION
  const handleElementToolbarUpdate = useCallback(
    (elementIdOrUpdatedElement, updates) => {
      console.log("🎯 TOOLBAR UPDATE TRIGGERED:", {
        elementIdOrUpdatedElement,
        updates,
        timestamp: new Date().toISOString(),
      });

      let elementId, elementUpdates;

      if (typeof elementIdOrUpdatedElement === "string") {
        elementId = elementIdOrUpdatedElement;
        elementUpdates = updates;
      } else {
        const updatedElement = elementIdOrUpdatedElement;
        elementId = updatedElement.id;
        elementUpdates = updatedElement;
      }

      console.log(
        "🎯 Processing update for element:",
        elementId,
        "with:",
        elementUpdates
      );

      // ✅ FIXED: Use updateElement instead of setElements
      updateElement(elementId, elementUpdates);

      console.log("🎯 Update completed via updateElement");
    },
    [updateElement] // ✅ Now depends on updateElement
  );

  // Handle element layer changes
  const handleElementLayerChange = useCallback(
    (elementId, direction) => {
      // TODO: Implement layer management
      setElements((prev) => {
        const idx = prev.findIndex((el) => el.id === elementId);
        if (idx === -1) return prev;
        let newElements = [...prev];
        if (direction === "up" && idx < prev.length - 1) {
          [newElements[idx], newElements[idx + 1]] = [
            newElements[idx + 1],
            newElements[idx],
          ];
        } else if (direction === "down" && idx > 0) {
          [newElements[idx], newElements[idx - 1]] = [
            newElements[idx - 1],
            newElements[idx],
          ];
        } else if (direction === "top") {
          const [el] = newElements.splice(idx, 1);
          newElements.push(el);
        } else if (direction === "bottom") {
          const [el] = newElements.splice(idx, 1);
          newElements.unshift(el);
        }
        return newElements;
      });
    },
    [setElements]
  );

  // Handle element duplication
  const handleElementDuplicate = useCallback(
    (elementId) => {
      setElements((prev) => {
        const el = prev.find((e) => e.id === elementId);
        if (!el) return prev;
        const newEl = { ...el, id: `${el.id}_copy_${Date.now()}` };
        return [...prev, newEl];
      });
    },
    [setElements]
  );

  // Universal toolbar handlers for controls
  const handleToolbarCopy = useCallback(() => {
    if (selectedElement) handleElementDuplicate(selectedElement.id);
  }, [selectedElement, handleElementDuplicate]);

  const handleToolbarBringForward = useCallback(() => {
    if (selectedElement) handleElementLayerChange(selectedElement.id, "up");
  }, [selectedElement, handleElementLayerChange]);

  const handleToolbarSendBackward = useCallback(() => {
    if (selectedElement) handleElementLayerChange(selectedElement.id, "down");
  }, [selectedElement, handleElementLayerChange]);

  const handleToolbarBringToFront = useCallback(() => {
    if (selectedElement) handleElementLayerChange(selectedElement.id, "top");
  }, [selectedElement, handleElementLayerChange]);

  const handleToolbarSendToBack = useCallback(() => {
    if (selectedElement) handleElementLayerChange(selectedElement.id, "bottom");
  }, [selectedElement, handleElementLayerChange]);

  // Update canvas position and scale when initialViewState changes
  useEffect(() => {
    /**
    console.log("🔵 useEffect #4 - Canvas position/scale fired");
    console.log("  - initialViewState:", initialViewState);
    console.log(
      "  - viewStateAppliedRef.current:",
      viewStateAppliedRef.current
    ); */

    if (
      (initialViewState.scale !== 1 ||
        initialViewState.position.x !== 0 ||
        initialViewState.position.y !== 0) &&
      !viewStateAppliedRef.current
    ) {
      //console.log("Applying saved view state:", initialViewState);
      setStageScale(initialViewState.scale);
      setStagePosition(initialViewState.position);
      viewStateAppliedRef.current = true;

      // Debug log to confirm state was updated
      /**
      console.log(
        "After applying view state - scale:",
        stageScale,
        "position:",
        stagePosition
      );*/

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

  // Simplified keyboard event handler - only Escape key
  useEffect(() => {
    console.log("🔵 useEffect #6 - Keyboard events fired");

    const handleKeyDown = (e) => {
      // Handle Escape key only
      if (e.key === "Escape") {
        if (selectedElement) {
          setNewSelectedElement(null);
        }
        if (editingElement) {
          editingManager.endEditing(); // ← Use editingManager instead of setEditingElement
        }
        if (document.fullscreenElement) {
          setIsFullScreen(false);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedElement, editingElement, setNewSelectedElement, editingManager]); // ← Update dependencies

  // ✅ BETTER: Self-contained fullscreen toggle
  const toggleFullScreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullScreen(true); // Direct state management
      } else {
        await document.exitFullscreen();
        setIsFullScreen(false); // Direct state management
      }
    } catch (err) {
      toast({
        title: "Fullscreen Error",
        description: `Could not toggle fullscreen: ${err.message}`,
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
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

  // EditorControls component for the left toolbar - simplified Add Text button
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
          onClick={addTextElementIntoCanvas}
          colorScheme="gray"
          variant="outline"
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

  return (() => {
    console.log("🔄 [RENDER] MemoryEditorPage is re-render");
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
            >
              <Stage
                ref={konvaStageRef}
                width={window.innerWidth - 60}
                height={window.innerHeight - 120}
                scaleX={stageScale}
                scaleY={stageScale}
                x={stagePosition.x}
                y={stagePosition.y}
                onWheel={handleWheel}
                onClick={(e) => {
                  /**
                  console.log("🟢 ===== onClick EVENT FIRED =====");
                  console.log(
                    "🟢 onClick - target type:",
                    e.target.getClassName?.() || "unknown"
                  );
                  console.log(
                    "🟢 onClick - target ID:",
                    e.target.id?.() || "no-id"
                  );
                  console.log("🟢 onClick - timestamp:", Date.now()); */
                  handleStageClick(e);
                }}
                draggable={true}
                onMouseMove={(e) => {
                  if (!e.target.isDragging()) {
                    const isOverElement = e.target !== e.target.getStage();
                    e.target.getStage().container().style.cursor = isOverElement
                      ? "move"
                      : "grab";
                  }
                }}
                onDragStart={(e) => {
                  const isStageTarget = e.target === e.target.getStage();

                  if (isStageTarget) {
                    console.log("🔴 [DRAG] - Drag on Canvas");
                    e.target.getStage().container().style.cursor = "grabbing";
                    handleStageDragStart(e);
                  } else {
                    console.log(
                      "🔴 onDragStart - Element target, preventing element drag"
                    );
                    e.evt.preventDefault();
                    e.target.stopDrag();
                  }
                }}
                onDragEnd={(e) => {
                  // console.log("🟡 ===== onDragEnd EVENT FIRED =====");

                  const isStageTarget = e.target === e.target.getStage();

                  if (isStageTarget) {
                    //console.log("🟡 Handling stage drag end");
                    e.target.getStage().container().style.cursor = "grab";
                    handleStageDragEnd(e);
                  } else {
                    //console.log("🟡 Ignoring non-stage drag event");
                  }
                }}
              >
                <Layer>
                  {elements.map((element) => {
                    // Inline renderer props (fixed per renderer)
                    const rendererProps = {
                      onUpdate: updateElement,
                      interactionHandlers: elementBehaviors,
                      isBeingEdited: editingManager.isElementEditing(
                        element.id
                      ),
                      onEditStart: () => {
                        setNewSelectedElement(element);
                        editingManager.startEditing(element);
                      },
                      onEditEnd: editingManager.endEditing,
                    };

                    const currentKey = `${element.id}-${element.version}`;
                    let renderer = rendererCacheRef.current.get(currentKey);

                    if (!renderer) {
                      //console.log(
                      //  `🟡 [RENDER] Rendering not found: ${element.id}-${element.version}`
                      //);
                      // Key not found - create new one
                      renderer = RendererFactory.createRenderer(
                        element,
                        rendererProps
                      );
                      rendererCacheRef.current.set(currentKey, renderer);
                      //console.log(
                      //  `🟡 [RENDER, CACHE] Re-Render and Set to Cache: ${currentKey}`
                      //);
                    } else {
                      console.log(
                        `🟡 [RENDER] Re-use Renderer: ${element.id}-${element.version}`
                      );
                    }
                    // Key found - check if there are multiple versions for this element
                    const elementKeys = [];
                    for (const key of rendererCacheRef.current.keys()) {
                      if (key.startsWith(element.id + "-")) {
                        elementKeys.push(key);
                      }
                    }

                    //console.log(`🟡 Total cache: ${elementKeys}`);
                    if (elementKeys.length > 1) {
                      // Multiple versions found - keep current, delete others
                      elementKeys.forEach((key) => {
                        if (key !== currentKey) {
                          //console.log(
                          // `🧹 [CACHE] Cleaning up old renderer: ${key}`
                          //);
                          rendererCacheRef.current.delete(key);
                        }
                      });
                    }
                    // If only one version, just return the existing renderer (no cleanup needed)

                    return renderer;
                  })}

                  <Transformer
                    ref={trRef}
                    boundBoxFunc={(oldBox, newBox) => {
                      if (newBox.width < 10 || newBox.height < 10) {
                        return oldBox;
                      }
                      return newBox;
                    }}
                  />
                </Layer>
              </Stage>

              {/* Element Toolbars - New integrated toolbar system */}
              {selectedElement && (
                <ElementToolbar
                  element={selectedElement}
                  isSelected={true}
                  isEditing={editingManager.isElementEditing(
                    selectedElement.id
                  )} // ← Fix this
                  onEdit={handleElementEdit}
                  onDelete={() => handleElementDelete(selectedElement.id)}
                  onUpdate={handleElementToolbarUpdate}
                  onCopy={handleToolbarCopy}
                  onBringForward={handleToolbarBringForward}
                  onSendBackward={handleToolbarSendBackward}
                  onBringToFront={handleToolbarBringToFront}
                  onSendToBack={handleToolbarSendToBack}
                  stageRef={konvaStageRef}
                />
              )}
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
        <ConfirmationDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={async () => {
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
          title="Delete Memory"
          message="Are you sure you want to delete this memory? This cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          confirmColorScheme="red"
          leastDestructiveRef={cancelRef}
        />
      </ErrorBoundary>
    );
  })();
};

export default MemoryEditorPage;
