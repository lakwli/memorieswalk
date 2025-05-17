import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Select,
  Spinner,
  Text,
  Tooltip,
  useToast,
  Icon,
} from "@chakra-ui/react";
import {
  ArrowBackIcon,
  AttachmentIcon,
  CheckIcon,
  CloseIcon,
  DeleteIcon,
  DownloadIcon,
  EditIcon,
  AddIcon,
  MinusIcon,
} from "@chakra-ui/icons";
import {
  FaShare,
  FaFont,
  FaPaintBrush,
  FaSyncAlt,
  FaLayerGroup,
} from "react-icons/fa";
import { Stage, Layer, Image as KonvaImage, Transformer } from "react-konva";
import Konva from "konva";
import PageLayout from "../layouts/PageLayout";
import memoryService from "../services/memoryService";
import ErrorBoundary from "../components/ErrorBoundary";

const ZOOM_FACTOR = 1.2;
const MIN_SCALE = 0.1;
const MAX_SCALE = 10;

const ZoomToFitIcon = (props) => (
  <Icon viewBox="0 0 20 20" {...props}>
    <path
      fill="currentColor"
      d="M15 5H5v10h10V5zm2-2H3v14h14V3zm-4 6H7v2h6V9z"
    />
  </Icon>
);

const MemoryEditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [memory, setMemory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [title, setTitle] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [viewType, setViewType] = useState("canvas");
  const [saving, setSaving] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [activePhotoId, setActivePhotoId] = useState(null);
  const stageContainerRef = useRef(null); // For the Box containing the Stage
  const konvaStageRef = useRef(null); // Ref for Konva Stage instance
  const fileInputRef = useRef(null);
  const trRef = useRef(null);

  const [stageScale, setStageScale] = useState(1);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const [isPanningMode, setIsPanningMode] = useState(false); // For spacebar panning

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === " " && !isPanningMode) {
        e.preventDefault();
        setIsPanningMode(true);
        if (konvaStageRef.current) {
          konvaStageRef.current.draggable(true);
        }
        if (stageContainerRef.current) {
          stageContainerRef.current.style.cursor = "grab";
        }
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === " ") {
        setIsPanningMode(false);
        if (konvaStageRef.current) {
          konvaStageRef.current.draggable(false);
        }
        if (stageContainerRef.current) {
          stageContainerRef.current.style.cursor = "default";
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isPanningMode]);

  const handleWheel = (e) => {
    e.evt.preventDefault();
    const scaleBy = 1.1; // This can be different from ZOOM_FACTOR for finer mouse wheel control
    const stage = konvaStageRef.current;
    if (stage) {
      const oldScale = stage.scaleX();
      const pointer = stage.getPointerPosition();

      if (!pointer) return;

      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };

      const newScale =
        e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
      const clampedNewScale = Math.max(
        MIN_SCALE,
        Math.min(newScale, MAX_SCALE)
      );

      setStageScale(clampedNewScale);
      setStagePosition({
        x: pointer.x - mousePointTo.x * clampedNewScale,
        y: pointer.y - mousePointTo.y * clampedNewScale,
      });
    }
  };

  useEffect(() => {
    const loadMemory = async () => {
      try {
        setLoading(true);
        const data = await memoryService.getMemory(id);
        setMemory(data);
        setTitle(data.title);
        setViewType(data.view_config?.type || data.view_type || "canvas");

        const photoData = await memoryService.getPhotosForMemory(id);

        let photoLayouts = {};
        if (data.view_configurations) {
          const canvasConfig = data.view_configurations.find(
            (vc) => vc.view_type === "canvas" && vc.is_primary_view
          );
          if (
            canvasConfig &&
            canvasConfig.configuration_data &&
            canvasConfig.configuration_data.photos
          ) {
            photoLayouts = canvasConfig.configuration_data.photos.reduce(
              (acc, pLayout) => {
                acc[pLayout.id] = pLayout;
                return acc;
              },
              {}
            );
            console.log(
              "[loadMemory] Parsed photoLayouts from view configuration:",
              photoLayouts
            );
          } else {
            console.log(
              "[loadMemory] No existing canvas photo layouts found in view configuration."
            );
          }
        } else {
          console.log(
            "[loadMemory] No view_configurations found on memory object."
          );
        }

        const loadedPhotos = await Promise.all(
          photoData.map((photo) => {
            return new Promise((resolve) => {
              const img = new window.Image();
              img.crossOrigin = "anonymous";

              (async () => {
                let objectURL = null;
                try {
                  const blob =
                    await memoryService.getPhotoBlobViewAuthenticated(photo.id);
                  objectURL = URL.createObjectURL(blob);
                  img.src = objectURL;

                  img.onload = () => {
                    const layout = photoLayouts[photo.id] || {};
                    resolve({
                      ...photo,
                      image: img,
                      objectURL, // Store for potential cleanup
                      x: layout.x || 50 + Math.random() * 50,
                      y: layout.y || 50 + Math.random() * 50,
                      width: layout.width || img.width / (layout.scale || 4),
                      height: layout.height || img.height / (layout.scale || 4),
                      rotation: layout.rotation || 0,
                    });
                  };
                  img.onerror = () => {
                    console.error(
                      "Failed to load image from blob URL:",
                      objectURL,
                      "Original photo ID:",
                      photo.id
                    );
                    toast({
                      title: "Image Load Error",
                      description: `Could not load image (from blob): ${
                        photo.metadata?.name || photo.id
                      }`,
                      status: "warning",
                      duration: 3000,
                      isClosable: true,
                    });
                    if (objectURL) URL.revokeObjectURL(objectURL);
                    resolve({ ...photo, image: null, x: 50, y: 50 });
                  };
                } catch (fetchError) {
                  console.error(
                    "Failed to fetch image blob:",
                    fetchError,
                    "Photo ID:",
                    photo.id
                  );
                  toast({
                    title: "Image Fetch Error",
                    description: `Could not fetch image data: ${
                      photo.metadata?.name || photo.id
                    }`,
                    status: "error",
                    duration: 3000,
                    isClosable: true,
                  });
                  if (objectURL) URL.revokeObjectURL(objectURL); // Clean up if created before error
                  resolve({ ...photo, image: null, x: 50, y: 50 });
                }
              })();
            });
          })
        );
        setPhotos(loadedPhotos.filter((p) => p.image));
      } catch (err) {
        console.error("Error loading memory:", err);
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

  useEffect(() => {
    return () => {
      photos.forEach((photo) => {
        if (photo.objectURL) {
          URL.revokeObjectURL(photo.objectURL);
        }
      });
    };
  }, [photos]);

  useEffect(() => {
    if (trRef.current) {
      if (activePhotoId) {
        const stage = konvaStageRef.current; // Use konvaStageRef
        if (stage) {
          const selectedNode = stage.findOne("#" + activePhotoId); // Select by ID
          if (selectedNode) {
            trRef.current.nodes([selectedNode]);
          } else {
            trRef.current.nodes([]);
          }
        } else {
          trRef.current.nodes([]);
        }
      } else {
        trRef.current.nodes([]);
      }
      if (trRef.current.getLayer()) {
        trRef.current.getLayer().batchDraw();
      }
    }
  }, [activePhotoId, photos]);

  const saveMemoryLayout = useCallback(async () => {
    if (!memory || !photos.length) {
      console.log(
        "[saveMemoryLayout] Aborted: No memory or no photos to save."
      );
      return;
    }

    const photoLayoutData = photos.map((p) => ({
      id: p.id,
      x: p.x,
      y: p.y,
      width: p.width,
      height: p.height,
      rotation: p.rotation || 0,
    }));
    console.log(
      "[saveMemoryLayout] photoLayoutData to be saved:",
      photoLayoutData
    );

    try {
      setSaving(true);
      let viewConfig = memory.view_configurations?.find(
        (vc) => vc.view_type === "canvas" && vc.is_primary_view
      );

      const configuration_data = {
        photos: photoLayoutData,
      };

      if (viewConfig) {
        await memoryService.updateMemoryViewConfiguration(
          memory.id,
          viewConfig.id,
          {
            configuration_data,
          }
        );
      } else {
        viewConfig = await memoryService.createMemoryViewConfiguration(
          memory.id,
          {
            name: "Primary Canvas Layout",
            view_type: "canvas",
            configuration_data,
            is_primary_view: true,
          }
        );
        setMemory((prev) => ({
          ...prev,
          view_configurations: [
            ...(prev.view_configurations || []),
            viewConfig,
          ],
        }));
      }

      toast({
        title: "Layout Saved",
        description: "Canvas layout saved successfully.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error("Error saving memory layout:", err);
      toast({
        title: "Layout Save Error",
        description: `Failed to save canvas layout: ${err.message}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  }, [memory, photos, toast]);

  const saveMemoryDetails = useCallback(async () => {
    if (!memory) return;

    try {
      setSaving(true);
      const updates = {
        title,
      };

      const updatedMemory = await memoryService.updateMemory(id, updates);
      setMemory((prev) => ({ ...prev, ...updatedMemory }));

      toast({
        title: "Saved",
        description: "Memory details saved successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error("Error saving memory details:", err);
      toast({
        title: "Error",
        description: `Failed to save memory: ${err.message}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  }, [id, memory, title, toast]);

  const handleSaveAll = async () => {
    await saveMemoryDetails();
    if (viewType === "canvas") {
      await saveMemoryLayout();
    }
  };

  const handleTitleSave = () => {
    if (title.trim() === "") {
      setTitle(memory.title);
      setEditingTitle(false);
      return;
    }
    saveMemoryDetails();
    setEditingTitle(false);
  };

  const handleViewTypeChange = async (e) => {
    const newViewType = e.target.value;
    if (viewType === "canvas" && newViewType !== "canvas") {
      const confirmSave = window.confirm(
        "Save current canvas layout before switching view?"
      );
      if (confirmSave) {
        await saveMemoryLayout();
      }
    }
    setViewType(newViewType);
  };

  const triggerPhotoUpload = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoUploadInputChange = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setSaving(true);

      const uploadedPhotoData = await memoryService.uploadPhotosToLibrary(
        Array.from(files)
      );

      if (!uploadedPhotoData || uploadedPhotoData.length === 0) {
        toast({
          title: "Upload Issue",
          description: "No photos were returned after upload.",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
        setSaving(false);
        return;
      }

      const photoIdsToLink = uploadedPhotoData.map((p) => p.id);

      await memoryService.linkPhotosToMemory(id, photoIdsToLink);

      const newKonvaPhotosPromises = uploadedPhotoData.map((photoMeta) => {
        return new Promise((resolve) => {
          const img = new window.Image();
          img.crossOrigin = "anonymous";

          (async () => {
            let objectURL = null;
            try {
              const blob = await memoryService.getPhotoBlobViewAuthenticated(
                photoMeta.id
              );
              objectURL = URL.createObjectURL(blob);
              img.src = objectURL;

              img.onload = () => {
                resolve({
                  ...photoMeta,
                  image: img,
                  objectURL, // Store for potential cleanup
                  x: 50 + Math.random() * 100,
                  y: 50 + Math.random() * 100,
                  width: img.width / 4,
                  height: img.height / 4,
                  rotation: 0,
                });
              };
              img.onerror = (errEvent) => {
                console.error(
                  "Failed to load uploaded image for Konva (from blob):",
                  objectURL,
                  "Original backend data:",
                  photoMeta,
                  "Error event:",
                  errEvent
                );
                toast({
                  title: "Image Load Error",
                  description: `Could not load image for display (from blob): ${
                    photoMeta.metadata?.name || photoMeta.id
                  }`,
                  status: "warning",
                  duration: 3000,
                  isClosable: true,
                });
                if (objectURL) URL.revokeObjectURL(objectURL);
                resolve(null);
              };
            } catch (fetchError) {
              console.error(
                "Failed to fetch uploaded image blob:",
                fetchError,
                "Photo ID:",
                photoMeta.id
              );
              toast({
                title: "Image Fetch Error",
                description: `Could not fetch uploaded image data: ${
                  photoMeta.metadata?.name || photoMeta.id
                }`,
                status: "error",
                duration: 5000,
                isClosable: true,
              });
              if (objectURL) URL.revokeObjectURL(objectURL); // Clean up if created before error
              resolve(null);
            }
          })();
        });
      });

      const settledKonvaPhotos = await Promise.allSettled(
        newKonvaPhotosPromises
      );
      const successfullyLoadedKonvaPhotos = settledKonvaPhotos
        .filter((result) => result.status === "fulfilled" && result.value)
        .map((result) => result.value);

      setPhotos((prevPhotos) => [
        ...prevPhotos,
        ...successfullyLoadedKonvaPhotos,
      ]);

      toast({
        title: "Photos Added",
        description: `${successfullyLoadedKonvaPhotos.length} photo(s) added to the canvas.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error("Error in photo upload and linking process:", err);
      toast({
        title: "Upload Error",
        description: `Failed to add photos: ${err.message}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handlePhotoUpdate = useCallback((photoId, newAttrs) => {
    setPhotos((prevPhotos) =>
      prevPhotos.map((p) => (p.id === photoId ? { ...p, ...newAttrs } : p))
    );
  }, []);

  const handleDragEnd = useCallback(
    (e) => {
      const node = e.target;
      const newPosition = { x: node.x(), y: node.y() };
      console.log(
        `[handleDragEnd] Photo ID: ${node.id()}, New Position:`,
        newPosition
      );
      handlePhotoUpdate(node.id(), newPosition);
    },
    [handlePhotoUpdate]
  );

  const handleTransformEnd = useCallback(
    (e) => {
      const node = e.target;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();

      // Reset scale on node before calculating new dimensions
      node.scaleX(1);
      node.scaleY(1);

      const newAttrs = {
        x: node.x(),
        y: node.y(),
        width: Math.max(20, node.width() * scaleX),
        height: Math.max(20, node.height() * scaleY),
        rotation: node.rotation(),
      };
      console.log(
        `[handleTransformEnd] Photo ID: ${node.id()}, New Attributes:`,
        newAttrs
      );
      handlePhotoUpdate(node.id(), newAttrs);
    },
    [handlePhotoUpdate]
  );

  const handleStageDragEnd = () => {
    if (konvaStageRef.current && isPanningMode) {
      setStagePosition(konvaStageRef.current.position());
    }
  };

  const handleZoom = (direction) => {
    const stage = konvaStageRef.current;
    const container = stageContainerRef.current;
    if (!stage || !container) return;

    const oldScale = stage.scaleX();
    let newScale;

    if (direction === "in") {
      newScale = oldScale * ZOOM_FACTOR;
    } else {
      newScale = oldScale / ZOOM_FACTOR;
    }
    newScale = Math.max(MIN_SCALE, Math.min(newScale, MAX_SCALE));

    const viewCenterX = container.offsetWidth / 2;
    const viewCenterY = container.offsetHeight / 2;

    const pointTo = {
      x: (viewCenterX - stage.x()) / oldScale,
      y: (viewCenterY - stage.y()) / oldScale,
    };

    setStageScale(newScale);
    setStagePosition({
      x: viewCenterX - pointTo.x * newScale,
      y: viewCenterY - pointTo.y * newScale,
    });
  };

  const handleZoomIn = () => handleZoom("in");
  const handleZoomOut = () => handleZoom("out");

  const handleZoomToFit = () => {
    const stage = konvaStageRef.current;
    const container = stageContainerRef.current;

    if (!stage || !container) {
      setStageScale(1);
      setStagePosition({ x: 0, y: 0 });
      return;
    }

    if (photos.length === 0) {
      setStageScale(1);
      setStagePosition({ x: 0, y: 0 });
      return;
    }

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    photos.forEach((photo) => {
      if (photo.image) {
        const photoRight = photo.x + (photo.width || photo.image.width / 4);
        const photoBottom = photo.y + (photo.height || photo.image.height / 4);

        minX = Math.min(minX, photo.x);
        minY = Math.min(minY, photo.y);
        maxX = Math.max(maxX, photoRight);
        maxY = Math.max(maxY, photoBottom);
      }
    });

    if (minX === Infinity || photos.every((p) => !p.image)) {
      setStageScale(1);
      setStagePosition({ x: 0, y: 0 });
      return;
    }

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    if (contentWidth <= 0 || contentHeight <= 0) {
      setStageScale(1);
      const viewCenterX = container.offsetWidth / 2;
      const viewCenterY = container.offsetHeight / 2;
      setStagePosition({
        x: viewCenterX - (minX + contentWidth / 2) * 1,
        y: viewCenterY - (minY + contentHeight / 2) * 1,
      });
      return;
    }

    const viewWidth = container.offsetWidth;
    const viewHeight = container.offsetHeight;
    const padding = 50;

    const scaleX = (viewWidth - 2 * padding) / contentWidth;
    const scaleY = (viewHeight - 2 * padding) / contentHeight;

    let newScale = Math.min(scaleX, scaleY);
    newScale = Math.max(MIN_SCALE, Math.min(newScale, MAX_SCALE));

    const newStageX = viewWidth / 2 - (minX + contentWidth / 2) * newScale;
    const newStageY = viewHeight / 2 - (minY + contentHeight / 2) * newScale;

    setStageScale(newScale);
    setStagePosition({ x: newStageX, y: newStageY });
  };

  const handleDeleteMemory = async () => {
    const confirm = window.confirm(
      "Are you sure you want to delete this memory? This cannot be undone."
    );
    if (!confirm) return;

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
      console.error("Error deleting memory:", err);
      toast({
        title: "Error",
        description: `Failed to delete memory: ${err.message}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (loading) {
    return (
      <PageLayout title="Loading Memory...">
        <Flex justify="center" align="center" height="200px">
          <Spinner
            thickness="4px"
            speed="0.65s"
            emptyColor="gray.200"
            color="brand.primary"
            size="xl"
          />
        </Flex>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout title="Error">
        <Box textAlign="center" p={8}>
          <Text color="red.500">{error}</Text>
          <Button mt={4} onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
        </Box>
      </PageLayout>
    );
  }

  const PageHeader = () => (
    <Flex
      bg="backgrounds.header"
      px={4}
      py={2}
      alignItems="center"
      justifyContent="space-between"
      borderBottom="1px solid"
      borderColor="borders.light"
      mb={4}
    >
      <IconButton
        aria-label="Back to dashboard"
        icon={<ArrowBackIcon />}
        variant="ghost"
        onClick={() => navigate("/dashboard")}
        mr={2}
      />

      {editingTitle ? (
        <Flex alignItems="center">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fontSize="20px"
            fontWeight="bold"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleTitleSave()}
            onBlur={handleTitleSave}
            size="md"
            mr={2}
          />
          <IconButton
            aria-label="Save Title"
            icon={<CheckIcon />}
            size="sm"
            onClick={handleTitleSave}
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
          />
        </Flex>
      ) : (
        <Flex
          alignItems="center"
          onClick={() => setEditingTitle(true)}
          cursor="pointer"
        >
          <Text fontSize="xl" fontWeight="bold" mr={2}>
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
        <Select
          value={viewType}
          onChange={handleViewTypeChange}
          w="150px"
          size="sm"
        >
          <option value="canvas">Canvas View</option>
          <option value="grid">Grid View</option>
          <option value="places">Places View</option>
          <option value="timeline">Timeline View</option>
        </Select>

        <Button
          leftIcon={<FaShare />}
          onClick={() => {}}
          size="sm"
          colorScheme="blue"
        >
          Share
        </Button>

        <Menu>
          <MenuButton
            as={IconButton}
            icon={<DeleteIcon />}
            variant="ghost"
            aria-label="Options"
            size="sm"
          />
          <MenuList>
            <MenuItem icon={<DeleteIcon />} onClick={handleDeleteMemory}>
              Delete Memory
            </MenuItem>
          </MenuList>
        </Menu>
      </HStack>
    </Flex>
  );

  const Toolbar = () => (
    <Flex
      bg="backgrounds.toolbarTranslucent"
      p={2}
      alignItems="center"
      boxShadow="sm"
      borderBottom="1px solid"
      borderColor="borders.light"
      mb={4}
    >
      <input
        type="file"
        accept="image/*"
        multiple
        ref={fileInputRef}
        onChange={handlePhotoUploadInputChange}
        style={{ display: "none" }}
      />
      <Tooltip label="Upload Photos">
        <IconButton
          aria-label="Upload Photos"
          icon={<AttachmentIcon />}
          mr={2}
          onClick={triggerPhotoUpload}
        />
      </Tooltip>

      <Tooltip label="Add Text (Not Implemented)">
        <IconButton aria-label="Text" icon={<FaFont />} mr={2} disabled />
      </Tooltip>

      <Tooltip label="Draw (Not Implemented)">
        <IconButton aria-label="Draw" icon={<FaPaintBrush />} mr={2} disabled />
      </Tooltip>

      <Tooltip label="Rotate (Not Implemented - use transform controls)">
        <IconButton aria-label="Rotate" icon={<FaSyncAlt />} mr={2} disabled />
      </Tooltip>

      <Tooltip label="Manage Layers (Not Implemented)">
        <IconButton
          aria-label="Layers"
          icon={<FaLayerGroup />}
          mr={2}
          disabled
        />
      </Tooltip>

      <Box flex="1" />

      <Button
        leftIcon={<DownloadIcon />}
        mr={2}
        size="sm"
        variant="outline"
        disabled
      >
        Download
      </Button>

      <Button
        leftIcon={saving ? <Spinner size="sm" /> : null}
        onClick={handleSaveAll}
        colorScheme="green"
        size="sm"
        isLoading={saving}
        disabled={saving}
      >
        {saving ? "Saving..." : "Save All"}
      </Button>
    </Flex>
  );

  return (
    <PageLayout title={memory ? memory.title : "Memory Editor"} fluid>
      <PageHeader />
      <Toolbar />
      <Flex direction="row" flex="1" overflow="hidden" h="calc(100vh - 128px)">
        <Box
          flex="1"
          p={viewType === "canvas" ? 0 : 4}
          bg="gray.100"
          position="relative"
          overflow="hidden"
          ref={stageContainerRef}
        >
          {viewType === "canvas" && (
            <Stage
              ref={konvaStageRef}
              width={
                stageContainerRef.current
                  ? stageContainerRef.current.offsetWidth
                  : window.innerWidth - 50
              }
              height={
                stageContainerRef.current
                  ? stageContainerRef.current.offsetHeight
                  : window.innerHeight - 150
              }
              style={{ backgroundColor: "white" }}
              onMouseDown={(e) => {
                const clickedOnEmpty = e.target === e.target.getStage();
                if (clickedOnEmpty && !isPanningMode) {
                  setActivePhotoId(null);
                }
                if (isPanningMode && stageContainerRef.current) {
                  stageContainerRef.current.style.cursor = "grabbing";
                }
              }}
              onMouseUp={() => {
                if (isPanningMode && stageContainerRef.current) {
                  stageContainerRef.current.style.cursor = "grab";
                }
              }}
              x={stagePosition.x}
              y={stagePosition.y}
              scaleX={stageScale}
              scaleY={stageScale}
              onDragEnd={handleStageDragEnd}
              onWheel={handleWheel}
            >
              <Layer>
                {photos.map(
                  (photo, index) =>
                    photo.image && (
                      <KonvaImage
                        key={photo.id || `photo-${index}`}
                        id={photo.id}
                        image={photo.image}
                        x={photo.x}
                        y={photo.y}
                        width={photo.width}
                        height={photo.height}
                        rotation={photo.rotation || 0}
                        draggable
                        onDragEnd={handleDragEnd}
                        onTransformEnd={handleTransformEnd}
                        onClick={() => setActivePhotoId(photo.id)}
                        onTap={() => setActivePhotoId(photo.id)}
                      />
                    )
                )}
                <Transformer
                  ref={trRef}
                  boundBoxFunc={(oldBox, newBox) => {
                    if (newBox.width < 20 || newBox.height < 20) {
                      return oldBox;
                    }
                    return newBox;
                  }}
                  anchorRenderer={(anchorNode, anchorName, transformer) => {
                    if (anchorName === "rotater") {
                      const anchorSize =
                        transformer.getAttr("anchorSize") || 10;
                      const rotateSymbol = new Konva.Text({
                        text: "↻",
                        fontSize: anchorSize * 1.8,
                        fill:
                          transformer.getAttr("anchorStroke") ||
                          "rgb(0, 161, 255)",
                        width: anchorSize * 2,
                        height: anchorSize * 2,
                        offsetX: anchorSize,
                        offsetY: anchorSize,
                        listening: true,
                      });
                      return rotateSymbol;
                    }
                    return anchorNode;
                  }}
                />
              </Layer>
            </Stage>
          )}
          {viewType === "grid" && <Box p={4}>Grid View (Not Implemented)</Box>}
          {viewType === "places" && (
            <Box p={4}>Places View (Not Implemented)</Box>
          )}
          {viewType === "timeline" && (
            <Box p={4}>Timeline View (Not Implemented)</Box>
          )}
          {viewType === "canvas" && (
            <Box
              position="absolute"
              bottom="20px"
              right="20px"
              zIndex="1000"
              boxShadow="md"
              borderRadius="md"
              bg="whiteAlpha.800"
            >
              <HStack spacing={1} p={2}>
                <Tooltip label="Zoom Out">
                  <IconButton
                    icon={<MinusIcon />}
                    onClick={handleZoomOut}
                    size="sm"
                    aria-label="Zoom out"
                  />
                </Tooltip>
                <Tooltip label="Zoom Level">
                  <Button
                    size="sm"
                    variant="outline"
                    minW="60px"
                    onClick={() => {}}
                    _hover={{ bg: "gray.100" }}
                    borderColor="gray.300"
                  >
                    {Math.round(stageScale * 100)}%
                  </Button>
                </Tooltip>
                <Tooltip label="Zoom In">
                  <IconButton
                    icon={<AddIcon />}
                    onClick={handleZoomIn}
                    size="sm"
                    aria-label="Zoom in"
                  />
                </Tooltip>
                <Tooltip label="Zoom to Fit">
                  <IconButton
                    icon={<ZoomToFitIcon />}
                    onClick={handleZoomToFit}
                    size="sm"
                    aria-label="Zoom to fit"
                  />
                </Tooltip>
              </HStack>
            </Box>
          )}
        </Box>
      </Flex>
    </PageLayout>
  );
};

export default function WrappedMemoryEditor() {
  return (
    <ErrorBoundary>
      <MemoryEditorPage />
    </ErrorBoundary>
  );
}
