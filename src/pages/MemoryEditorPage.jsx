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
} from "@chakra-ui/react";
import {
  ArrowBackIcon,
  AttachmentIcon,
  CheckIcon,
  CloseIcon,
  DeleteIcon,
  DownloadIcon,
  EditIcon,
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
  const [activeTool, setActiveTool] = useState(null);
  const stageRef = useRef(null); // This ref is for the <Box> container for layout purposes
  const konvaStageRef = useRef(null); // Ref for Konva Stage instance
  const fileInputRef = useRef(null);
  const trRef = useRef(null);

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
          }
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
    if (!memory || !photos.length) return;

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
      handlePhotoUpdate(node.id(), { x: node.x(), y: node.y() });
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

      handlePhotoUpdate(node.id(), {
        x: node.x(),
        y: node.y(),
        width: Math.max(20, node.width() * scaleX),
        height: Math.max(20, node.height() * scaleY),
        rotation: node.rotation(),
      });
    },
    [handlePhotoUpdate]
  );

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
        <IconButton
          aria-label="Text"
          icon={<FaFont />}
          mr={2}
          onClick={() => setActiveTool("text")}
          disabled
        />
      </Tooltip>

      <Tooltip label="Draw (Not Implemented)">
        <IconButton
          aria-label="Draw"
          icon={<FaPaintBrush />}
          mr={2}
          onClick={() => setActiveTool("draw")}
          disabled
        />
      </Tooltip>

      <Tooltip label="Rotate (Not Implemented - use transform controls)">
        <IconButton
          aria-label="Rotate"
          icon={<FaSyncAlt />}
          mr={2}
          onClick={() => setActiveTool("rotate")}
          disabled
        />
      </Tooltip>

      <Tooltip label="Manage Layers (Not Implemented)">
        <IconButton
          aria-label="Layers"
          icon={<FaLayerGroup />}
          mr={2}
          onClick={() => setActiveTool("layers")}
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
          overflow="auto"
          ref={stageRef}
        >
          {viewType === "canvas" && (
            <Stage
              ref={konvaStageRef} // Assign konvaStageRef to Konva Stage
              width={
                stageRef.current
                  ? stageRef.current.offsetWidth
                  : window.innerWidth - 50
              }
              height={
                stageRef.current
                  ? stageRef.current.offsetHeight
                  : window.innerHeight - 150
              }
              style={{ backgroundColor: "white" }}
              onMouseDown={(e) => {
                const clickedOnEmpty = e.target === e.target.getStage();
                if (clickedOnEmpty) {
                  setActivePhotoId(null);
                }
              }}
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
