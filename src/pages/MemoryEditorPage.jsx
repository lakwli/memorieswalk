import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Avatar,
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Image,
  Input,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Select,
  Spinner,
  Text,
  Tooltip,
  useToast,
  VStack,
} from "@chakra-ui/react";
import {
  AddIcon,
  ArrowBackIcon,
  AttachmentIcon,
  CheckIcon,
  CloseIcon,
  DeleteIcon,
  EditIcon,
  MinusIcon,
  RepeatIcon,
} from "@chakra-ui/icons";
import {
  FaExpand,
  FaCompress,
  FaEllipsisV,
  FaFont,
  FaLayerGroup,
  FaPaintBrush,
  FaSave,
  FaRegHandPaper,
} from "react-icons/fa";
import { Stage, Layer, Image as KonvaImage, Transformer } from "react-konva";
import Konva from "konva";
import memoryService from "../services/memoryService";
import ErrorBoundary from "../components/ErrorBoundary";
import LogoSvg from "../assets/logo.svg";
import { useAuth } from "../context/AuthContext";

const ZOOM_FACTOR = 1.2;
const MIN_SCALE = 0.1;
const MAX_SCALE = 10;
const EDITOR_TOOLS_PALETTE_WIDTH = "50px";

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
  const [viewType, setViewType] = useState("canvas");
  const [saving, setSaving] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [activePhotoId, setActivePhotoId] = useState(null);
  const stageContainerRef = useRef(null);
  const konvaStageRef = useRef(null);
  const fileInputRef = useRef(null);
  const trRef = useRef(null);

  const [stageScale, setStageScale] = useState(1);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const [isPanningMode, setIsPanningMode] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [activeTool, setActiveTool] = useState(null);

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullScreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
    };
  }, []);

  // Effect for Spacebar interaction with panning mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === " " && !editingTitle) {
        e.preventDefault();
        if (!isPanningMode) {
          setIsPanningMode(true);
        }
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === " ") {
        if (activeTool !== "pan") {
          setIsPanningMode(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [editingTitle, activeTool, isPanningMode]);

  // Effect to manage isPanningMode based on activeTool
  useEffect(() => {
    if (activeTool === "pan") {
      if (!isPanningMode) {
        setIsPanningMode(true);
      }
    }
  }, [activeTool, isPanningMode]);

  // Effect for managing cursor style based on panning mode
  useEffect(() => {
    if (stageContainerRef.current) {
      if (isPanningMode) {
        stageContainerRef.current.style.cursor = "grab";
      } else {
        stageContainerRef.current.style.cursor = "default";
      }
    }
  }, [isPanningMode, activeTool]);

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

  const handleWheel = (e) => {
    e.evt.preventDefault();
    const scaleBy = 1.1;
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
        const currentViewConfig = Array.isArray(data.view_configurations)
          ? data.view_configurations.find(
              (vc) => vc.view_type === "canvas" && vc.is_primary_view
            )
          : null;

        setViewType(currentViewConfig?.view_type || data.view_type || "canvas");

        const photoData = await memoryService.getPhotosForMemory(id);

        let photoLayouts = {};
        if (
          currentViewConfig &&
          currentViewConfig.configuration_data &&
          currentViewConfig.configuration_data.photos
        ) {
          currentViewConfig.configuration_data.photos.forEach((layout) => {
            photoLayouts[layout.id] = layout;
          });
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
                    const layout = photoLayouts[String(photo.id)] || {};
                    resolve({
                      id: String(photo.id),
                      image: img,
                      objectURL,
                      x: layout.x || 50,
                      y: layout.y || 50,
                      width: layout.width || img.naturalWidth / 4,
                      height: layout.height || img.naturalHeight / 4,
                      rotation: layout.rotation || 0,
                      filename: photo.metadata?.name || `photo-${photo.id}`,
                    });
                  };
                  img.onerror = (errEvent) => {
                    console.error(
                      `Image load error for photo ${photo.id}:`,
                      errEvent,
                      "Error type:",
                      errEvent.type
                    );
                    toast({
                      title: "Image Load Error",
                      description: `Could not display image ${
                        photo.metadata?.name || photo.id
                      } (type: ${errEvent.type}).`,
                      status: "warning",
                      duration: 4000,
                      isClosable: true,
                    });
                    if (objectURL) URL.revokeObjectURL(objectURL);
                    resolve(null);
                  };
                } catch (fetchErr) {
                  console.error(
                    "Failed to fetch image blob:",
                    fetchErr,
                    "Photo ID:",
                    photo.id
                  );
                  toast({
                    title: "Image Fetch Error",
                    description: `Could not load image data for ${
                      photo.metadata?.name || photo.id
                    }: ${fetchErr.message}`,
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                  });
                  if (objectURL) URL.revokeObjectURL(objectURL);
                  resolve({ ...photo, image: null, x: 50, y: 50 });
                }
              })();
            });
          })
        );
        setPhotos(loadedPhotos.filter((p) => p.image));
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
        const stage = konvaStageRef.current;
        if (stage) {
          const selectedNode = stage.findOne("#" + activePhotoId);
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
    if (title !== memory.title) {
      saveMemoryDetails();
    }
    setEditingTitle(false);
  };

  const handleViewTypeChange = async (newViewType) => {
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
                const stage = konvaStageRef.current;
                const container = stageContainerRef.current;
                let initialX = 50;
                let initialY = 50;

                if (stage && container) {
                  const viewCenterX =
                    (container.offsetWidth / 2 - stage.x()) / stage.scaleX();
                  const viewCenterY =
                    (container.offsetHeight / 2 - stage.y()) / stage.scaleY();
                  initialX =
                    viewCenterX -
                    img.width / (2 * 2) +
                    (Math.random() - 0.5) * 50;
                  initialY =
                    viewCenterY -
                    img.height / (2 * 2) +
                    (Math.random() - 0.5) * 50;
                }

                resolve({
                  id: String(photoMeta.id),
                  image: img,
                  objectURL,
                  x: initialX,
                  y: initialY,
                  width: img.width / 2,
                  height: img.height / 2,
                  rotation: 0,
                  filename: photoMeta.metadata?.name || `photo-${photoMeta.id}`,
                });
              };
              img.onerror = (errEvent) => {
                console.error(
                  "Error loading image from object URL:",
                  errEvent,
                  "Photo ID:",
                  photoMeta.id,
                  "Attempted URL:",
                  objectURL
                );
                toast({
                  title: "Image Load Error",
                  description: `Failed to display image ${
                    photoMeta.metadata?.name || photoMeta.id
                  } (type: ${
                    errEvent.type
                  }). It might be corrupted or an unsupported format.`,
                  status: "error",
                  duration: 5000,
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
                description: `Could not fetch uploaded image data for ${
                  photoMeta.metadata?.name || photoMeta.id
                }: ${fetchError.message}`,
                status: "error",
                duration: 5000,
                isClosable: true,
              });
              if (objectURL) URL.revokeObjectURL(objectURL);
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
      handlePhotoUpdate(String(node.id()), newPosition);
    },
    [handlePhotoUpdate]
  );

  const handleTransformEnd = useCallback(
    (e) => {
      const node = e.target;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();

      node.scaleX(1);
      node.scaleY(1);

      const newAttrs = {
        x: node.x(),
        y: node.y(),
        width: Math.max(20, node.width() * scaleX),
        height: Math.max(20, node.height() * scaleY),
        rotation: node.rotation(),
      };
      handlePhotoUpdate(String(node.id()), newAttrs);
    },
    [handlePhotoUpdate]
  );

  const handleStageDragEnd = () => {
    if (konvaStageRef.current) {
      setStagePosition(konvaStageRef.current.position());
    }
  };

  const handleStageClick = (e) => {
    if (e.target === e.target.getStage()) {
      setActivePhotoId(null);
      return;
    }

    if (!e.target.hasName("photo-image")) {
      return;
    }
    const id = e.target.id();
    setActivePhotoId(id);
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
      <Flex justify="center" align="center" height="100vh" bg="gray.50">
        <Spinner
          thickness="4px"
          speed="0.65s"
          emptyColor="gray.200"
          color="brand.primary"
          size="xl"
        />
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

  const EditorTopBar = () => (
    <Flex
      as="header"
      align="center"
      justify="space-between"
      p={2}
      bg="backgrounds.header"
      borderBottom="1px solid"
      borderColor="borders.light"
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
        <Tooltip label="Upload Photos">
          <IconButton
            aria-label="Upload Photos"
            icon={<AttachmentIcon />}
            onClick={triggerPhotoUpload}
            size="md"
          />
        </Tooltip>
        <Tooltip label="Save All Changes">
          <Button
            leftIcon={<FaSave />}
            onClick={handleSaveAll}
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
            <MenuItem onClick={handleDeleteMemory} icon={<DeleteIcon />}>
              Delete Memory
            </MenuItem>
            <Box px={3} py={2}>
              <Text fontSize="sm" color="gray.500">
                View Type:
              </Text>
              <Select
                value={viewType}
                onChange={(e) => handleViewTypeChange(e.target.value)}
                size="sm"
                mt={1}
              >
                <option value="canvas">Canvas View</option>
                <option value="grid">Grid View</option>
                <option value="places">Places View</option>
                <option value="timeline">Timeline View</option>
              </Select>
            </Box>
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

  const EditorBottomControlsBar = () => (
    <Flex
      as="footer"
      position="fixed"
      bottom="0"
      left="0"
      right="0"
      p={2}
      bg="whiteAlpha.900"
      boxShadow="0 -2px 5px rgba(0,0,0,0.05)"
      justify="center"
      align="center"
      h="50px"
      zIndex="docked"
    >
      <HStack spacing={2}>
        <Tooltip label="Zoom Out">
          <IconButton
            icon={<MinusIcon />}
            onClick={handleZoomOut}
            size="sm"
            aria-label="Zoom out"
            isDisabled={stageScale <= MIN_SCALE}
          />
        </Tooltip>
        <Tooltip label="Zoom Level">
          <Button
            size="sm"
            variant="outline"
            minW="70px"
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
            isDisabled={stageScale >= MAX_SCALE}
          />
        </Tooltip>
        <Tooltip label="Zoom to Fit Content">
          <IconButton
            icon={<RepeatIcon />}
            onClick={handleZoomToFit}
            size="sm"
            aria-label="Zoom to fit"
          />
        </Tooltip>
        <Tooltip label={isFullScreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
          <IconButton
            icon={isFullScreen ? <FaCompress /> : <FaExpand />}
            onClick={toggleFullScreen}
            size="sm"
            aria-label="Toggle fullscreen"
          />
        </Tooltip>
      </HStack>
    </Flex>
  );

  const EditorToolsPalette = () => (
    <VStack
      as="aside"
      spacing={3}
      p={2}
      bg="white"
      boxShadow="md"
      position="absolute"
      left="0"
      top="0"
      bottom="0"
      h="100%"
      w={EDITOR_TOOLS_PALETTE_WIDTH}
      zIndex="overlay"
      borderRight="1px solid"
      borderColor="gray.200"
    >
      <Tooltip label="Add Text (Not Implemented)" placement="right">
        <IconButton
          aria-label="Add Text"
          icon={<FaFont />}
          variant={activeTool === "text" ? "solid" : "ghost"}
          colorScheme={activeTool === "text" ? "blue" : "gray"}
          onClick={() => setActiveTool(activeTool === "text" ? null : "text")}
          isDisabled
          w="100%"
        />
      </Tooltip>
      <Tooltip label="Pan View (Spacebar)" placement="right">
        <IconButton
          aria-label="Pan tool"
          icon={<FaRegHandPaper />}
          size="lg"
          variant={isPanningMode ? "solid" : "outline"}
          colorScheme={isPanningMode ? "blue" : "gray"}
          onClick={() => {
            toast({
              title: "Hold Spacebar to Pan",
              status: "info",
              duration: 2000,
              isClosable: true,
            });
          }}
        />
      </Tooltip>
      <Tooltip label="Draw (Not Implemented)" placement="right">
        <IconButton
          aria-label="Draw"
          icon={<FaPaintBrush />}
          variant={activeTool === "draw" ? "solid" : "ghost"}
          colorScheme={activeTool === "draw" ? "blue" : "gray"}
          onClick={() => setActiveTool(activeTool === "draw" ? null : "draw")}
          isDisabled
          w="100%"
        />
      </Tooltip>
      <Tooltip label="Manage Layers (Not Implemented)" placement="right">
        <IconButton
          aria-label="Manage Layers"
          icon={<FaLayerGroup />}
          variant={activeTool === "layers" ? "solid" : "ghost"}
          colorScheme={activeTool === "layers" ? "blue" : "gray"}
          onClick={() =>
            setActiveTool(activeTool === "layers" ? null : "layers")
          }
          isDisabled
          w="100%"
        />
      </Tooltip>
    </VStack>
  );

  return (
    <Box display="flex" flexDirection="column" h="100vh" bg="gray.50">
      <EditorTopBar />

      <Flex
        as="main"
        flex="1"
        overflow="hidden"
        position="relative"
        pb={viewType === "canvas" ? "50px" : "0"}
      >
        {viewType === "canvas" && <EditorToolsPalette />}

        <Box
          flex="1"
          p={0}
          bg="gray.200"
          position="relative"
          overflow="hidden"
          ref={stageContainerRef}
          id="stage-container"
          ml={viewType === "canvas" ? EDITOR_TOOLS_PALETTE_WIDTH : "0px"}
          style={{ cursor: isPanningMode ? "grab" : "default" }}
        >
          {viewType === "canvas" &&
            konvaStageRef &&
            stageContainerRef.current && (
              <Stage
                ref={konvaStageRef}
                width={stageContainerRef.current.offsetWidth}
                height={stageContainerRef.current.offsetHeight}
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
                draggable={isPanningMode}
                onDragEnd={handleStageDragEnd}
                onWheel={handleWheel}
                onClick={handleStageClick}
              >
                <Layer>
                  {photos.map(
                    (photo, index) =>
                      photo.image && (
                        <KonvaImage
                          key={photo.id || `photo-${index}`}
                          id={String(photo.id)}
                          image={photo.image}
                          x={photo.x}
                          y={photo.y}
                          width={photo.width}
                          height={photo.height}
                          rotation={photo.rotation || 0}
                          draggable={!isPanningMode}
                          onDragEnd={handleDragEnd}
                          onTransformEnd={handleTransformEnd}
                          onClick={() => {
                            if (!isPanningMode)
                              setActivePhotoId(String(photo.id));
                          }}
                          onTap={() => {
                            if (!isPanningMode)
                              setActivePhotoId(String(photo.id));
                          }}
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
                        const circle = new Konva.Circle({
                          radius: anchorSize / 1.5,
                          fill:
                            transformer.getAttr("anchorStroke") ||
                            "rgb(0, 161, 255)",
                          stroke: transformer.getAttr("anchorFill") || "white",
                          strokeWidth: 1,
                        });
                        return circle;
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
        </Box>
      </Flex>

      {viewType === "canvas" && <EditorBottomControlsBar />}

      <input
        type="file"
        accept="image/*"
        multiple
        ref={fileInputRef}
        onChange={handlePhotoUploadInputChange}
        style={{ display: "none" }}
      />
    </Box>
  );
};

export default function WrappedMemoryEditor() {
  return (
    <ErrorBoundary>
      <MemoryEditorPage />
    </ErrorBoundary>
  );
}
