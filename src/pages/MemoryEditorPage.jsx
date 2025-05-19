import React, { useState, useEffect, useRef, useCallback } from "react";
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
} from "@chakra-ui/react";
import {
  Stage,
  Layer,
  Image as KonvaImage,
  Transformer,
  Text as KonvaText,
} from "react-konva";
import { FaSave } from "react-icons/fa";
import {
  ArrowBackIcon,
  EditIcon,
  CheckIcon,
  CloseIcon,
  AttachmentIcon,
} from "@chakra-ui/icons";
import memoryService from "../services/memoryService";
import ErrorBoundary from "../components/ErrorBoundary";

const MIN_SCALE = 0.1;
const MAX_SCALE = 10;
const ZOOM_FACTOR = 1.2;
const MIN_FONT_SIZE = 8;
const MAX_FONT_SIZE = 144;

const MemoryEditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [memory, setMemory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [title, setTitle] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [texts, setTexts] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [stageScale, setStageScale] = useState(1);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const [isPanningMode, setIsPanningMode] = useState(false);

  const stageContainerRef = useRef(null);
  const konvaStageRef = useRef(null);
  const fileInputRef = useRef(null);
  const trRef = useRef(null);

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
                    resolve({
                      ...photo,
                      image: img,
                      objectURL,
                      x: 50,
                      y: 50,
                      width: img.naturalWidth / 4,
                      height: img.naturalHeight / 4,
                      rotation: 0,
                      isNew: true, // Mark as new photo
                      state: "N", // Initial state is New
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
                    try {
                      blob = await memoryService.getPhoto(photo.id, "P");
                    } catch (error) {
                      console.error(
                        "Failed to load from permanent storage:",
                        error
                      );
                      blob = await memoryService.getPhoto(photo.id, "N");
                    }

                    const objectURL = URL.createObjectURL(blob);
                    img.src = objectURL;

                    img.onload = () => {
                      resolve({
                        ...photo,
                        image: img,
                        objectURL,
                        x: photo.x || 50,
                        y: photo.y || 50,
                        width: photo.width || img.naturalWidth / 4,
                        height: photo.height || img.naturalHeight / 4,
                        rotation: photo.rotation || 0,
                        state: photo.state || "P",
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

  // Handle zoom and pan
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === " " && !editingTitle) {
        e.preventDefault();
        setIsPanningMode(true);
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === " ") {
        setIsPanningMode(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [editingTitle]);

  const handleZoom = (direction) => {
    const scaleBy = direction === "in" ? ZOOM_FACTOR : 1 / ZOOM_FACTOR;
    const stage = konvaStageRef.current;
    const oldScale = stageScale;
    const pointer = stage.getPointerPosition();

    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = Math.max(
      MIN_SCALE,
      Math.min(oldScale * scaleBy, MAX_SCALE)
    );

    setStageScale(newScale);
    setStagePosition({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };

  const handleWheel = (e) => {
    e.evt.preventDefault();
    const direction = e.evt.deltaY > 0 ? "out" : "in";
    handleZoom(direction);
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

  // Save memory with photo states
  const saveMemoryLayout = useCallback(async () => {
    if (!memory) return;

    // Prepare photo data with complete metadata for backend
    const photoData = photos.map((p) => ({
      id: p.id,
      state: p.state, // Keep original state from upload or backend
      x: p.x,
      y: p.y,
      width: p.width,
      height: p.height,
      rotation: p.rotation || 0,
      originalWidth: p.originalWidth,
      originalHeight: p.originalHeight,
      size: p.size,
    }));

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
      const updateData = {
        title,
        canvas: {
          photos: photoData,
          texts: textData,
        },
      };
      console.log("Sending update to backend:", {
        memoryId: memory.id,
        updateData: JSON.stringify(updateData),
        photosCount: photoData.length,
        newPhotos: photoData.filter((p) => p.state === "N").length,
      });

      await memoryService.updateMemory(memory.id, updateData);

      // Clear current photos since we'll reload from backend
      photos.forEach((p) => {
        if (p.objectURL) {
          URL.revokeObjectURL(p.objectURL);
        }
      });

      // Reload memory data after successful save to ensure consistency
      const updatedMemory = await memoryService.getMemory(memory.id);
      setMemory(updatedMemory);

      const loadedPhotos = await Promise.all(
        updatedMemory.photos.map((photo) => {
          return new Promise((resolve) => {
            const img = new window.Image();
            img.crossOrigin = "anonymous";

            (async () => {
              try {
                // Try permanent storage first, then temp if needed
                let blob;
                try {
                  blob = await memoryService.getPhoto(photo.id, "P");
                } catch (error) {
                  console.error(
                    "Failed to load from permanent storage:",
                    error
                  );
                  blob = await memoryService.getPhoto(photo.id, "N");
                }
                const objectURL = URL.createObjectURL(blob);
                img.src = objectURL;

                img.onload = () => {
                  resolve({
                    ...photo,
                    image: img,
                    objectURL,
                    x: photo.x || 50,
                    y: photo.y || 50,
                    width: photo.width || img.naturalWidth / 4,
                    height: photo.height || img.naturalHeight / 4,
                    rotation: photo.rotation || 0,
                    state: photo.state, // Keep state from backend response
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

  if (loading) {
    return (
      <Flex h="100vh" align="center" justify="center">
        <Box textAlign="center">
          <Spinner size="xl" mb={4} />
          <Text>Loading memory...</Text>
        </Box>
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex h="100vh" align="center" justify="center">
        <Box textAlign="center">
          <Text color="red.500" mb={4}>
            Error: {error}
          </Text>
          <Button onClick={() => navigate("/memories")}>
            Back to Memories
          </Button>
        </Box>
      </Flex>
    );
  }

  return (
    <ErrorBoundary>
      <Box h="100vh" display="flex" flexDirection="column">
        {/* Top Bar */}
        <Flex
          p={4}
          bg="white"
          borderBottom="1px solid"
          borderColor="gray.200"
          alignItems="center"
          justifyContent="space-between"
        >
          <HStack spacing={4}>
            <IconButton
              icon={<ArrowBackIcon />}
              onClick={() => navigate("/memories")}
              aria-label="Back to memories"
            />
            {editingTitle ? (
              <HStack>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  size="md"
                  width="auto"
                />
                <IconButton
                  icon={<CheckIcon />}
                  onClick={() => {
                    setEditingTitle(false);
                    saveTitle();
                  }}
                  aria-label="Save title"
                  colorScheme="green"
                />
                <IconButton
                  icon={<CloseIcon />}
                  onClick={() => {
                    setTitle(memory.title);
                    setEditingTitle(false);
                  }}
                  aria-label="Cancel editing"
                />
              </HStack>
            ) : (
              <HStack>
                <Text fontSize="xl" fontWeight="bold">
                  {title}
                </Text>
                <IconButton
                  icon={<EditIcon />}
                  onClick={() => setEditingTitle(true)}
                  aria-label="Edit title"
                  size="sm"
                />
              </HStack>
            )}
          </HStack>

          <HStack spacing={4}>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: "none" }}
              ref={fileInputRef}
            />
            <Button
              leftIcon={<AttachmentIcon />}
              onClick={() => fileInputRef.current?.click()}
            >
              Add Photos
            </Button>
            <Button
              leftIcon={<FaSave />}
              onClick={saveMemoryLayout}
              isLoading={saving}
              colorScheme="blue"
            >
              Save
            </Button>
          </HStack>
        </Flex>

        {/* Canvas Area */}
        <Box
          flex="1"
          position="relative"
          overflow="hidden"
          ref={stageContainerRef}
        >
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
                <KonvaImage
                  key={photo.id}
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
              <Transformer ref={trRef} />
            </Layer>
          </Stage>
        </Box>
      </Box>
    </ErrorBoundary>
  );
};

export default MemoryEditorPage;
