import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  Select,
  Tooltip,
  Avatar,
} from "@chakra-ui/react";
import {
  Stage,
  Layer,
  Image as KonvaImage,
  Transformer,
  Text as KonvaText,
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
import { useAuth } from "../context/AuthContext";
import memoryService from "../services/memoryService";
import LogoSvg from "../assets/logo.svg";
import Konva from "konva";
import ErrorBoundary from "../components/ErrorBoundary";
import TextPropertiesToolbar from "../components/TextPropertiesToolbar";

const MIN_SCALE = 0.1;
const MAX_SCALE = 10;
const ZOOM_FACTOR = 1.2;

const MIN_FONT_SIZE = 8;
const MAX_FONT_SIZE = 144;

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
  const [texts, setTexts] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const stageContainerRef = useRef(null);
  const konvaStageRef = useRef(null);
  const fileInputRef = useRef(null);
  const trRef = useRef(null);

  const [stageScale, setStageScale] = useState(1);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const [isPanningMode, setIsPanningMode] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [activeTool, setActiveTool] = useState(null);

  const handleFileUpload = useCallback(
    async (e) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      try {
        const uploadedPhotos = await memoryService.uploadPhotosToLibrary(files);
        if (uploadedPhotos && uploadedPhotos.length > 0) {
          // Link the uploaded photos to this memory
          const photoIds = uploadedPhotos.map((photo) => photo.id);
          await memoryService.linkPhotosToMemory(id, photoIds);

          // Refresh photos for memory
          const photoData = await memoryService.getPhotosForMemory(id);

          const newPhotos = await Promise.all(
            photoData
              .filter(
                (photo) =>
                  !photos.some(
                    (existing) => String(existing.id) === String(photo.id)
                  )
              )
              .map((photo) => {
                return new Promise((resolve) => {
                  const img = new window.Image();
                  img.crossOrigin = "anonymous";

                  (async () => {
                    let objectURL = null;
                    try {
                      const blob =
                        await memoryService.getPhotoBlobViewAuthenticated(
                          photo.id
                        );
                      objectURL = URL.createObjectURL(blob);
                      img.src = objectURL;

                      img.onload = () => {
                        resolve({
                          id: String(photo.id),
                          image: img,
                          objectURL,
                          x: 50,
                          y: 50,
                          width: img.naturalWidth / 4,
                          height: img.naturalHeight / 4,
                          rotation: 0,
                          filename: photo.metadata?.name || `photo-${photo.id}`,
                        });
                      };
                      img.onerror = (errEvent) => {
                        console.error(
                          `Image load error for photo ${photo.id}:`,
                          errEvent
                        );
                        if (objectURL) URL.revokeObjectURL(objectURL);
                        resolve(null);
                      };
                    } catch (fetchErr) {
                      console.error("Failed to fetch image blob:", fetchErr);
                      if (objectURL) URL.revokeObjectURL(objectURL);
                      resolve(null);
                    }
                  })();
                });
              })
          );

          setPhotos((prev) => [
            ...prev,
            ...newPhotos.filter((p) => p !== null),
          ]);

          toast({
            title: "Photos Uploaded",
            description: `Successfully uploaded ${uploadedPhotos.length} photos`,
            status: "success",
            duration: 3000,
            isClosable: true,
          });
        }
      } catch (err) {
        toast({
          title: "Upload Error",
          description: `Failed to upload photos: ${err.message}`,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } finally {
        // Clear the file input
        e.target.value = "";
      }
    },
    [id, photos, toast]
  );

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullScreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
    };
  }, []);

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

  useEffect(() => {
    if (activeTool === "pan") {
      if (!isPanningMode) {
        setIsPanningMode(true);
      }
    }
  }, [activeTool, isPanningMode]);

  useEffect(() => {
    if (stageContainerRef.current) {
      if (isPanningMode) {
        stageContainerRef.current.style.cursor = "grab";
      } else if (activeTool === "text") {
        stageContainerRef.current.style.cursor = "text";
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

        if (
          currentViewConfig &&
          currentViewConfig.configuration_data &&
          currentViewConfig.configuration_data.texts
        ) {
          const loadedTexts = currentViewConfig.configuration_data.texts.map(
            (text) => ({
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
            })
          );
          setTexts(loadedTexts);
        } else {
          setTexts([]);
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
      if (selectedElement && selectedElement.id) {
        const stage = konvaStageRef.current;
        if (stage) {
          const selectedNode = stage.findOne("#" + selectedElement.id);
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
  }, [selectedElement, photos, texts]);

  const saveMemoryLayout = useCallback(async () => {
    if (!memory) {
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

    const textLayoutData = texts.map((t) => ({
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
      let viewConfig = memory.view_configurations?.find(
        (vc) => vc.view_type === "canvas" && vc.is_primary_view
      );

      const configuration_data = {
        photos: photoLayoutData,
        texts: textLayoutData,
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
  }, [memory, photos, texts, toast]);

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

  const handleElementUpdate = useCallback(
    (elementId, elementType, newAttrs) => {
      if (elementType === "photo") {
        setPhotos((prevPhotos) =>
          prevPhotos.map((p) =>
            p.id === elementId ? { ...p, ...newAttrs } : p
          )
        );
      } else if (elementType === "text") {
        setTexts((prevTexts) =>
          prevTexts.map((t) => {
            if (t.id === elementId) {
              const updatedText = { ...t, ...newAttrs };
              if (typeof updatedText.fontSize === "number") {
                updatedText.fontSize = Math.max(
                  MIN_FONT_SIZE,
                  Math.min(updatedText.fontSize, MAX_FONT_SIZE)
                );
              }
              return updatedText;
            }
            return t;
          })
        );
      }
    },
    []
  );

  const handleDragEnd = useCallback(
    (e) => {
      const node = e.target;
      const id = String(node.id());
      const type = node.hasName("photo-image") ? "photo" : "text";
      const newPosition = { x: node.x(), y: node.y() };
      handleElementUpdate(id, type, newPosition);
    },
    [handleElementUpdate]
  );

  const handleTransformEnd = useCallback(
    (e) => {
      const node = e.target;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      const id = String(node.id());
      const type = node.hasName("photo-image") ? "photo" : "text";

      node.scaleX(1);
      node.scaleY(1);

      let newAttrs;
      if (type === "photo") {
        newAttrs = {
          x: node.x(),
          y: node.y(),
          width: Math.max(20, node.width() * scaleX),
          height: Math.max(20, node.height() * scaleY),
          rotation: node.rotation(),
        };
      } else {
        let newFontSize = node.fontSize() * scaleY;
        newFontSize = Math.max(
          MIN_FONT_SIZE,
          Math.min(newFontSize, MAX_FONT_SIZE)
        );

        newAttrs = {
          x: node.x(),
          y: node.y(),
          rotation: node.rotation(),
          fontSize: newFontSize,
        };
      }
      handleElementUpdate(id, type, newAttrs);
    },
    [handleElementUpdate]
  );

  const handleStageDragEnd = () => {
    if (konvaStageRef.current) {
      setStagePosition(konvaStageRef.current.position());
    }
  };

  const handleStageClick = (e) => {
    if (e.target === e.target.getStage()) {
      if (activeTool === "text") {
        const stage = konvaStageRef.current;
        const pointer = stage.getPointerPosition();
        if (!pointer) return;

        const newTextId = `text-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 5)}`;
        const newText = {
          id: newTextId,
          type: "text",
          x: pointer.x,
          y: pointer.y,
          text: "New Text",
          fontSize: Math.max(MIN_FONT_SIZE, Math.min(24, MAX_FONT_SIZE)),
          fontFamily: "Arial",
          fill: "#000000",
          draggable: true,
          rotation: 0,
          width: 200,
          wrap: "char",
          align: "left",
          fontStyle: "normal",
          textDecoration: "",
        };
        setTexts((prevTexts) => [...prevTexts, newText]);
        setSelectedElement({ id: newTextId, type: "text" });
        setActiveTool(null);
      } else {
        setSelectedElement(null);
      }
      return;
    }

    const clickedOnTransformer =
      e.target.getParent() instanceof Konva.Transformer;
    if (clickedOnTransformer) {
      return;
    }

    const id = e.target.id();
    const isPhoto = e.target.hasName("photo-image");
    const isText = e.target.hasName("text-element");

    if (isPhoto) {
      setSelectedElement({ id, type: "photo" });
    } else if (isText) {
      setSelectedElement({ id, type: "text" });
    } else {
      setSelectedElement(null);
    }
  };

  const handleTextDblClick = (e) => {
    const textNode = e.target;
    const textNodeId = textNode.id();

    textNode.hide();
    trRef.current.nodes([]);
    trRef.current.getLayer().batchDraw();

    const stage = textNode.getStage();
    const stageBox = stage.container().getBoundingClientRect();

    const areaPosition = {
      x: stageBox.left + textNode.absolutePosition().x,
      y: stageBox.top + textNode.absolutePosition().y,
    };

    const textarea = document.createElement("textarea");
    document.body.appendChild(textarea);

    textarea.value = textNode.text();
    textarea.style.position = "absolute";
    textarea.style.top = areaPosition.y + "px";
    textarea.style.left = areaPosition.x + "px";
    textarea.style.width =
      textNode.width() * stage.scaleX() - textNode.padding() * 2 + "px";
    textarea.style.height =
      textNode.height() * stage.scaleY() - textNode.padding() * 2 + "px";
    textarea.style.fontSize = textNode.fontSize() * stage.scaleY() + "px";
    textarea.style.border = "none";
    textarea.style.padding = "0px";
    textarea.style.margin = "0px";
    textarea.style.overflow = "hidden";
    textarea.style.background = "none";
    textarea.style.outline = "none";
    textarea.style.resize = "none";
    textarea.style.lineHeight = textNode.lineHeight();
    textarea.style.fontFamily = textNode.fontFamily();
    textarea.style.transformOrigin = "left top";
    textarea.style.textAlign = textNode.align();
    textarea.style.color = textNode.fill();

    const fontStyle = textNode.fontStyle() || "normal";
    if (fontStyle.includes("bold")) {
      textarea.style.fontWeight = "bold";
    }
    if (fontStyle.includes("italic")) {
      textarea.style.fontStyle = "italic";
    }
    textarea.style.textDecoration = textNode.textDecoration() || "";

    textarea.focus();

    function removeTextarea() {
      if (textarea.parentNode) {
        textarea.parentNode.removeChild(textarea);
      }
      window.removeEventListener("click", handleOutsideClick);
      textNode.show();
      trRef.current.nodes([textNode]);
      trRef.current.getLayer().batchDraw();
      setSelectedElement({ id: textNodeId, type: "text" });
    }

    textarea.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        textNode.text(textarea.value);
        handleElementUpdate(textNodeId, "text", { text: textarea.value });
        removeTextarea();
      }
      if (e.key === "Escape") {
        removeTextarea();
      }
    });

    textarea.addEventListener("blur", function () {
      textNode.text(textarea.value);
      handleElementUpdate(textNodeId, "text", { text: textarea.value });
      removeTextarea();
    });

    function handleOutsideClick(e) {
      if (e.target !== textarea) {
        textNode.text(textarea.value);
        handleElementUpdate(textNodeId, "text", { text: textarea.value });
        removeTextarea();
      }
    }
    setTimeout(() => {
      window.addEventListener("click", handleOutsideClick);
    });
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

    if (photos.length === 0 && texts.length === 0) {
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

    texts.forEach((text) => {
      const textRight = text.x + text.width;
      const textBottom = text.y + text.height;

      minX = Math.min(minX, text.x);
      minY = Math.min(minY, text.y);
      maxX = Math.max(maxX, textRight);
      maxY = Math.max(maxY, textBottom);
    });

    if (
      minX === Infinity ||
      (photos.every((p) => !p.image) && texts.length === 0)
    ) {
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
          onClick={handleZoomToFit}
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

  const selectedTextElement =
    selectedElement?.type === "text"
      ? texts.find((t) => t.id === selectedElement.id)
      : null;

  return (
    <ErrorBoundary>
      <Flex direction="column" height="100vh" bg="backgrounds.main">
        <EditorTopBar />
        {selectedTextElement && (
          <Box
            p={2}
            bg="gray.50"
            borderBottom="1px solid"
            borderColor="borders.light"
            boxShadow="sm"
          >
            <TextPropertiesToolbar
              element={selectedTextElement}
              onUpdate={(newAttrs) => {
                handleElementUpdate(selectedElement.id, "text", newAttrs);
              }}
            />
          </Box>
        )}
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

                const newTextId = `text-${Date.now()}-${Math.random()
                  .toString(36)
                  .substr(2, 5)}`;
                const newText = {
                  id: newTextId,
                  type: "text",
                  x: dropPosition.x,
                  y: dropPosition.y,
                  text: droppedText,
                  fontSize: Math.max(
                    MIN_FONT_SIZE,
                    Math.min(24, MAX_FONT_SIZE)
                  ),
                  fontFamily: "Arial",
                  fill: "#000000",
                  draggable: true,
                  rotation: 0,
                  width: 200,
                  wrap: "char",
                  align: "left",
                  fontStyle: "normal",
                  textDecoration: "",
                };
                setTexts((prevTexts) => [...prevTexts, newText]);
                setSelectedElement({ id: newTextId, type: "text" });
                setActiveTool(null);
              }
            }}
            onDragOver={(e) => e.preventDefault()}
          >
            <Stage
              ref={konvaStageRef}
              width={
                stageContainerRef.current?.clientWidth || window.innerWidth
              }
              height={
                stageContainerRef.current?.clientHeight || window.innerHeight
              }
              scaleX={stageScale}
              scaleY={stageScale}
              x={stagePosition.x}
              y={stagePosition.y}
              onWheel={handleWheel}
              draggable={isPanningMode}
              onDragEnd={handleStageDragEnd}
              onClick={handleStageClick}
              onDblClick={handleTextDblClick}
            >
              <Layer>
                {photos.map((photo) => (
                  <KonvaImage
                    key={photo.id}
                    id={String(photo.id)}
                    image={photo.image}
                    x={photo.x}
                    y={photo.y}
                    width={photo.width}
                    height={photo.height}
                    rotation={photo.rotation}
                    draggable
                    onDragEnd={handleDragEnd}
                    onTransformEnd={handleTransformEnd}
                    name="photo-image"
                  />
                ))}
                {texts.map((text) => (
                  <KonvaText
                    key={text.id}
                    id={String(text.id)}
                    x={text.x}
                    y={text.y}
                    text={text.text}
                    fontSize={text.fontSize}
                    fontFamily={text.fontFamily}
                    fill={text.fill}
                    draggable
                    rotation={text.rotation}
                    fontStyle={text.fontStyle}
                    textDecoration={text.textDecoration}
                    onDragEnd={handleDragEnd}
                    onTransformEnd={handleTransformEnd}
                    name="text-element"
                    width={text.width}
                    wrap={text.wrap || "char"}
                    align={text.align || "left"}
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
                />
              </Layer>
            </Stage>
          </Box>
        </Flex>

        {/* Hidden file input for photo uploads */}
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileUpload}
          accept="image/*"
          multiple
        />
      </Flex>
    </ErrorBoundary>
  );
};

export default MemoryEditorPage;
