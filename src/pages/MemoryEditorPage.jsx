// ============================================================================
// REFACTORED MEMORY EDITOR COMPONENT
// ============================================================================
import { useMemo } from "react";
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
  useElementBehaviors,
  useCanvasNavigation,
  useUploadManager,
  useCanvasTools,
} from "../hooks";

// Import new toolbar system
import { ElementToolbar } from "../components/canvas/toolbars";
import { TextElement } from "../components/canvas/elements";
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
  if (!window.memoryEditorRenderCount) window.memoryEditorRenderCount = 0;
  window.memoryEditorRenderCount++;

  console.log(`🏠 MemoryEditorPage render #${window.memoryEditorRenderCount}`);
  console.log(`🏠 MemoryEditorPage timestamp: ${new Date().toISOString()}`);
  const prevDepsRef = useRef();

  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user, logout } = useAuth();

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

  const elementBehaviors = useElementBehaviors(
    updateElement,
    setNewSelectedElement,
    editingManager,
    removeElement
  );

  // ✅ Log when useMemo dependencies change
  console.log("🔍 useMemo dependencies check:");
  console.log("  - elements length:", elements.length);
  console.log("  - editingManager:", !!editingManager);
  console.log("  - updateElement:", typeof updateElement);
  console.log("  - elementBehaviors:", !!elementBehaviors);
  console.log("  - setNewSelectedElement:", typeof setNewSelectedElement);

  const memoizedElements = useMemo(() => {
    console.log(
      "🔧 Memoizing elements - only re-compute when elements array changes"
    );

    return elements.map((element) => {
      // ✅ Create stable props object
      const rendererProps = {
        onUpdate: updateElement,
        interactionHandlers: elementBehaviors,
        isBeingEdited: editingManager.isElementEditing(element.id),
        onEditStart: () => {
          setNewSelectedElement(element);
          editingManager.startEditing(element);
        },
        onEditEnd: () => editingManager.endEditing(),
      };

      return RendererFactory.createRenderer(element, rendererProps);
    });
  }, [
    elements,
    editingManager,
    updateElement,
    elementBehaviors,
    setNewSelectedElement,
  ]);

  useEffect(() => {
    const currentDeps = {
      elementsLength: elements.length,
      elementsIds: elements.map((el) => el.id).join(","),
      editingManagerType: typeof editingManager,
      updateElementString: updateElement.toString().slice(0, 100),
      elementBehaviorsType: typeof elementBehaviors,
      setNewSelectedElementString: setNewSelectedElement
        .toString()
        .slice(0, 100),
    };

    if (prevDepsRef.current) {
      console.log("🔍 Dependency comparison:");
      Object.keys(currentDeps).forEach((key) => {
        const prev = prevDepsRef.current[key];
        const curr = currentDeps[key];
        if (prev !== curr) {
          console.log(`  ❌ ${key} CHANGED:`);
          console.log(`    From: ${prev}`);
          console.log(`    To:   ${curr}`);
        } else {
          console.log(`  ✅ ${key} unchanged`);
        }
      });
    } else {
      console.log("🔍 First render - establishing baseline");
    }

    prevDepsRef.current = currentDeps;
  });

  // PERFORMANCE: Disabled expensive logging useEffects that were causing unnecessary re-renders
  // useEffect(() => {
  //   console.log("🔵 selectedElement changed:", selectedElement?.id || "null");
  // }, [selectedElement]);

  // useEffect(() => {
  //   console.log("📦 elements array changed:", {
  //     count: elements.length,
  //     elements: elements.map((el) => ({ id: el.id, type: el.type })),
  //     timestamp: new Date().toISOString(),
  //   });
  // }, [elements]);

  // Get element behaviors with editing state management (no more activeTool)
  // Get element behaviors with editing state management (no more activeTool)

  // Other existing state...
  const [memory, setMemory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [title, setTitle] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  //const [toolbarElementId, setToolbarElementId] = useState(null);

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

  // Canvas Tools hook - Initialize BEFORE Upload Manager to provide canvas config
  const canvasToolsConfig = {
    stageRef: konvaStageRef,
    // Remove stageScale and stagePosition to prevent unnecessary re-renders
    // Tools will get current scale/position dynamically when needed
  };

  const { handleTextDrop, getTool } = useCanvasTools(canvasToolsConfig);

  // ✅ Photo creation handler (follows addTextElementIntoCanvas pattern)
  const addPhotoElementsIntoCanvas = useCallback(
    async (imageDataArray) => {
      console.log("🚀 ===== STARTING PHOTO ELEMENT CREATION =====");

      try {
        const {
          width: canvasWidth,
          height: canvasHeight,
          source,
        } = canvasUtils.getCanvasDimensions(konvaStageRef, stageContainerRef);

        console.log("🚀 Canvas dimensions:", {
          canvasWidth,
          canvasHeight,
          source,
        });

        for (const imageData of imageDataArray) {
          console.log("🚀 Creating photo element for:", imageData.fileName);

          // ✅ Calculate size explicitly here (single source of truth)
          const displaySize = photoUtils.calculateDisplaySize(
            imageData.originalWidth,
            imageData.originalHeight,
            canvasWidth,
            canvasHeight
          );

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

          // Create PhotoElement with smart sizing
          const photoElement = createElement(ELEMENT_TYPES.PHOTO, {
            ...imageData,
            width: displaySize.width,
            height: displaySize.height,
          });

          console.log("🚀 Created photo element:", {
            id: photoElement.id,
            size: { width: photoElement.width, height: photoElement.height },
          });

          // Step 4: Position using elementBehaviors (same as text)
          elementBehaviors.addElementIntoCanvas(photoElement, konvaStageRef);
          console.log("🚀 Positioned photo in canvas center");

          // Step 6: Set selection and toolbar (same as text) - for last uploaded photo
          setNewSelectedElement(photoElement);
          //setToolbarElementId(photoElement.id);
          console.log("🚀 Selected photo:", photoElement.id);
        }

        console.log("🚀 ===== PHOTO ELEMENT CREATION COMPLETED =====");
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
    [
      createElement, // ✅ Same as addTextElementIntoCanvas
      elementBehaviors, // ✅ Same as addTextElementIntoCanvas
      konvaStageRef, // ✅ Same as addTextElementIntoCanvas
      setNewSelectedElement, // ✅ Same as addTextElementIntoCanvas
      //  setToolbarElementId, // ✅ Same as addTextElementIntoCanvas
      toast,
    ]
  );

  // Upload Manager hook
  console.log("🔍 About to call useUploadManager with config:", {
    onUploadComplete: typeof addPhotoElementsIntoCanvas,
    addPhotoElementsIntoCanvasString: addPhotoElementsIntoCanvas
      .toString()
      .slice(0, 50),
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
      // ✅ Handle photo creation in MemoryEditorPage
      addPhotoElementsIntoCanvas(imageDataArray);
    },
  });

  // ✅ Add this logging right after Upload Manager hook
  console.log("🔍 Upload Manager state:", {
    isUploading,
    uploadStatus,
    currentProgress,
    currentPhase,
  });

  // Synchronize selectedElement and editingElement with updated elements
  // DISABLED: This was causing toolbar to disappear due to unnecessary re-renders
  // useEffect(() => {
  //   // Update selectedElement reference if it exists in updated elements
  //   if (selectedElement) {
  //     const updatedSelectedElement = elements.find(
  //       (el) => el.id === selectedElement.id
  //     );
  //     if (
  //       updatedSelectedElement &&
  //       updatedSelectedElement !== selectedElement
  //     ) {
  //       console.log("Updating selectedElement reference:", selectedElement.id);
  //       setSelectedElement(updatedSelectedElement);
  //     }
  //   }

  //   // Update editingElement reference if it exists in updated elements
  //   if (editingElement) {
  //     const updatedEditingElement = elements.find(
  //       (el) => el.id === editingElement.id
  //     );
  //     if (updatedEditingElement && updatedEditingElement !== editingElement) {
  //       console.log("Updating editingElement reference:", editingElement.id);
  //       setEditingElement(updatedEditingElement);
  //     }
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [elements]); // Only depend on elements to avoid circular dependencies
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

  // Private method to handle element selection changes
  const handleElementSelection = useCallback(
    (newElement) => {
      const previousElement = selectedElement;
      const previousId = previousElement?.id || null;
      const newId = newElement?.id || null;

      // Do nothing if selection hasn't changed
      if (previousId === newId) {
        console.log("🔍 Selection unchanged, skipping:", newId);
        return;
      }

      console.log("🔍 Selection changing:", { from: previousId, to: newId });

      // End any current editing session
      if (editingManager.editingElement) {
        editingManager.endEditing();
      }

      // Update React state
      setNewSelectedElement(newElement);

      // Update transformer based on new selection
      //updateTransformer(newElement);
      //setToolbarElementId(newId);
    },
    [
      editingManager,
      setNewSelectedElement,
      selectedElement,
      //updateTransformer,
    ] // ← Add updateTransformer
  );

  const handleStageClick = useCallback(
    (e) => {
      console.log("🔍 handleStageClick called - determining what was clicked");

      const clickedNode = e.target;
      const stage = e.target.getStage();

      if (clickedNode === stage) {
        // Clicked on empty stage - clear selection
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
    console.log("🔵 useEffect #3 - Load memory fired");
    console.log("  - id:", id);
    console.log("  - toast:", typeof toast);
    console.log("  - setElements:", typeof setElements);
    console.log("  - elementStates:", !!elementStates);
    console.log("  - getTool:", typeof getTool);

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
                    const photoTool = getTool(ELEMENT_TYPES.PHOTO);
                    const photoElement = photoTool.createPhotoElementFromData(
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
  }, [id, toast, setElements, elementStates, getTool]);

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

  const addTextElementIntoCanvas = useCallback(() => {
    const textElement = createElement(ELEMENT_TYPES.TEXT);

    elementBehaviors.addElementIntoCanvas(textElement, konvaStageRef);
    setNewSelectedElement(textElement);
    //handleElementSelection(textElement);
  }, [elementBehaviors, konvaStageRef, createElement, setNewSelectedElement]);

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

      // Handle both call patterns:
      // 1. (elementId, updates) - from ElementRenderer
      // 2. (updatedElement) - from EditingToolbar via ElementToolbar

      let elementId, elementUpdates;

      if (typeof elementIdOrUpdatedElement === "string") {
        // Called as (elementId, updates)
        elementId = elementIdOrUpdatedElement;
        elementUpdates = updates;
      } else {
        // Called as (updatedElement)
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

      // CRITICAL CHANGE: Always use the Object.assign approach to preserve editing state
      // This prevents any re-renders from interfering with editing/selection state
      setElements((prev) => {
        console.log("🎯 setElements - updating element:", elementId);
        return prev.map((el) => {
          if (el.id === elementId) {
            // Preserve the class instance by updating properties directly
            // This prevents creating new object references that could disrupt editing state
            if (typeof elementIdOrUpdatedElement === "string") {
              // Pattern 1: apply partial updates
              Object.assign(el, elementUpdates);
            } else {
              // Pattern 2: replace with new element but preserve reference
              Object.assign(el, elementUpdates);
            }
            console.log("🎯 Element updated successfully:", el.id);
            return el;
          }
          return el;
        });
      });

      console.log("🎯 Update completed - editing state should be preserved");
    },
    [setElements]
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
    console.log("🔵 useEffect #4 - Canvas position/scale fired");
    console.log("  - initialViewState:", initialViewState);
    console.log(
      "  - viewStateAppliedRef.current:",
      viewStateAppliedRef.current
    );

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

  // Handle fullscreen toggle
  //useEffect(() => {
  //  console.log("🔵 useEffect #5 - Fullscreen fired");
  //
  //  const handleFullScreenChange = () => {
  //    setIsFullScreen(!!document.fullscreenElement);
  //// };
  // document.addEventListener("fullscreenchange", handleFullScreenChange);
  // return () => {
  //   document.removeEventListener("fullscreenchange", handleFullScreenChange);
  // };
  //}, []);

  // Simplified keyboard event handler - only Escape key
  useEffect(() => {
    console.log("🔵 useEffect #6 - Keyboard events fired");
    console.log("  - selectedElement:", selectedElement?.id || "null");
    console.log("  - editingElement:", editingElement?.id || "null");

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
              if (e.dataTransfer.types.includes("text/plain")) {
                const droppedText = e.dataTransfer.getData("text/plain");
                handleTextDrop(
                  droppedText,
                  createElement,
                  setNewSelectedElement
                );
              }
            }}
            onDragOver={(e) => e.preventDefault()}
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
                console.log("🟢 ===== onClick EVENT FIRED =====");
                console.log(
                  "🟢 onClick - target type:",
                  e.target.getClassName?.() || "unknown"
                );
                console.log(
                  "🟢 onClick - target ID:",
                  e.target.id?.() || "no-id"
                );
                console.log("🟢 onClick - timestamp:", Date.now());
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
                console.log("🔴 ===== onDragStart EVENT FIRED =====");
                console.log(
                  "🔴 onDragStart - target type:",
                  e.target.getClassName?.() || "unknown"
                );
                console.log(
                  "🔴 onDragStart - target ID:",
                  e.target.id?.() || "no-id"
                );
                console.log("🔴 onDragStart - timestamp:", Date.now());
                console.log(
                  "🔴 onDragStart - is Stage?",
                  e.target === e.target.getStage()
                );

                const isStageTarget = e.target === e.target.getStage();

                if (isStageTarget) {
                  console.log(
                    "🔴 onDragStart - Stage target, starting canvas drag"
                  );
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
                console.log("🟡 ===== onDragEnd EVENT FIRED =====");

                const isStageTarget = e.target === e.target.getStage();

                if (isStageTarget) {
                  console.log("🟡 Handling stage drag end");
                  e.target.getStage().container().style.cursor = "grab";
                  handleStageDragEnd(e);
                } else {
                  console.log("🟡 Ignoring non-stage drag event");
                }
              }}
            >
              <Layer>
                {memoizedElements}
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
                isEditing={editingManager.isElementEditing(selectedElement.id)} // ← Fix this
                onEdit={handleElementEdit}
                onDelete={() => removeElement(selectedElement.id)}
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
};

export default MemoryEditorPage;
