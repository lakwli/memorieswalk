import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Flex,
  Heading,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Spinner,
  Text,
  Tooltip,
  useToast,
  HStack,
  Select,
  SimpleGrid,
} from "@chakra-ui/react";
import {
  AttachmentIcon,
  DownloadIcon,
  DeleteIcon,
  ArrowBackIcon,
  EditIcon,
  CheckIcon,
  CloseIcon,
} from "@chakra-ui/icons";
import {
  FaFont,
  FaPaintBrush,
  FaShare,
  FaLayerGroup,
  FaSyncAlt,
} from "react-icons/fa";
import MasterLayout from "../layouts/MasterLayout";
import { memoryService } from "../services/memoryService";
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
  const [activePhoto, setActivePhoto] = useState(null);
  const [activeTool, setActiveTool] = useState(null);

  useEffect(() => {
    const loadMemory = async () => {
      try {
        setLoading(true);
        const data = await memoryService.getMemory(id);
        setMemory(data);
        setTitle(data.title);
        setViewType(data.view_type || "canvas");

        // Load photos for this memory
        const photoData = await memoryService.getPhotosForMemory(id);
        setPhotos(photoData);
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

  const saveMemory = useCallback(async () => {
    if (!memory) return;

    try {
      setSaving(true);
      const updates = {
        title,
        view_type: viewType,
        memory_data: memory.memory_data, // Preserve existing memory data
      };

      const updatedMemory = await memoryService.updateMemory(id, updates);
      setMemory(updatedMemory);

      toast({
        title: "Saved",
        description: "Memory saved successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error("Error saving memory:", err);
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
  }, [id, memory, title, toast, viewType]);

  const handleTitleSave = () => {
    if (title.trim() === "") {
      setTitle(memory.title);
      setEditingTitle(false);
      return;
    }

    saveMemory();
    setEditingTitle(false);
  };

  const handleViewTypeChange = (e) => {
    setViewType(e.target.value);
    saveMemory();
  };

  const handleShareMemory = async () => {
    try {
      const shareData = await memoryService.createShareLink(id);
      const shareUrl = `${window.location.origin}/shared/${shareData.token}`;

      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl);

      toast({
        title: "Link Copied",
        description: "Share link copied to clipboard",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error("Error creating share link:", err);
      toast({
        title: "Error",
        description: `Failed to create share link: ${err.message}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handlePhotoUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;

    input.onchange = async (e) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      // In a real app, you'd upload to server/S3 etc
      // Here we'll create client-side URLs for demo
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Create photo object
        const newPhoto = {
          file_path: URL.createObjectURL(file),
          // In a real app, you'd extract this data from EXIF
          location_lat: null,
          location_lng: null,
          captured_place: null,
          captured_at: null,
          metadata: {
            name: file.name,
            size: file.size,
            type: file.type,
          },
        };

        try {
          const savedPhoto = await memoryService.addPhotoToMemory(id, newPhoto);
          setPhotos((prev) => [...prev, savedPhoto]);
        } catch (err) {
          console.error("Error uploading photo:", err);
          toast({
            title: "Error",
            description: `Failed to upload photo: ${err.message}`,
            status: "error",
            duration: 5000,
            isClosable: true,
          });
        }
      }
    };

    input.click();
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
      <MasterLayout>
        <Flex justify="center" align="center" height="200px">
          <Spinner
            thickness="4px"
            speed="0.65s"
            emptyColor="gray.200"
            color="brand.primary"
            size="xl"
          />
        </Flex>
      </MasterLayout>
    );
  }

  if (error) {
    return (
      <MasterLayout>
        <Box textAlign="center" p={8}>
          <Heading size="md" mb={4} color="red.500">
            Error Loading Memory
          </Heading>
          <Text>{error}</Text>
          <Button mt={4} onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
        </Box>
      </MasterLayout>
    );
  }

  return (
    <MasterLayout>
      <Box>
        {/* Header */}
        <Flex
          bg="backgrounds.header"
          px={4}
          py={2}
          alignItems="center"
          justifyContent="space-between"
          borderBottom="1px solid"
          borderColor="borders.light"
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
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  fontSize: "20px",
                  fontWeight: "bold",
                  border: "1px solid #E2E8F0",
                  padding: "0 8px",
                  borderRadius: "4px",
                }}
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleTitleSave()}
              />
              <IconButton
                aria-label="Save"
                icon={<CheckIcon />}
                size="sm"
                ml={2}
                onClick={handleTitleSave}
              />
              <IconButton
                aria-label="Cancel"
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
            <Flex alignItems="center">
              <Heading size="md" mr={2}>
                {title}
              </Heading>
              <IconButton
                aria-label="Edit title"
                icon={<EditIcon />}
                size="xs"
                variant="ghost"
                onClick={() => setEditingTitle(true)}
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
              onClick={handleShareMemory}
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

        {/* Toolbar */}
        <Flex
          bg="backgrounds.toolbarTranslucent"
          p={2}
          alignItems="center"
          position="sticky"
          top="0"
          zIndex="10"
          boxShadow="sm"
          borderBottom="1px solid"
          borderColor="borders.light"
        >
          <Tooltip label="Upload Photos">
            <IconButton
              aria-label="Upload"
              icon={<AttachmentIcon />}
              mr={2}
              isActive={activeTool === "upload"}
              onClick={handlePhotoUpload}
            />
          </Tooltip>

          <Tooltip label="Add Text">
            <IconButton
              aria-label="Text"
              icon={<FaFont />}
              mr={2}
              isActive={activeTool === "text"}
              onClick={() => setActiveTool("text")}
            />
          </Tooltip>

          <Tooltip label="Draw">
            <IconButton
              aria-label="Draw"
              icon={<FaPaintBrush />}
              mr={2}
              isActive={activeTool === "draw"}
              onClick={() => setActiveTool("draw")}
            />
          </Tooltip>

          <Tooltip label="Rotate">
            <IconButton
              aria-label="Rotate"
              icon={<FaSyncAlt />}
              mr={2}
              isActive={activeTool === "rotate"}
              onClick={() => setActiveTool("rotate")}
            />
          </Tooltip>

          <Tooltip label="Manage Layers">
            <IconButton
              aria-label="Layers"
              icon={<FaLayerGroup />}
              mr={2}
              isActive={activeTool === "layers"}
              onClick={() => setActiveTool("layers")}
            />
          </Tooltip>

          <Box flex="1" />

          <Button
            leftIcon={<DownloadIcon />}
            mr={2}
            size="sm"
            variant="outline"
          >
            Download
          </Button>

          <Button
            leftIcon={saving ? <Spinner size="sm" /> : null}
            onClick={saveMemory}
            colorScheme="green"
            size="sm"
            isLoading={saving}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </Flex>

        {/* Canvas/Workspace */}
        <Box
          bg="backgrounds.canvasArea"
          minHeight="calc(100vh - 120px)"
          p={4}
          position="relative"
          overflow={viewType === "canvas" ? "auto" : "visible"}
        >
          {viewType === "canvas" && (
            <Box width="3000px" height="3000px" position="relative" bg="white">
              {/* This is where the canvas items would be rendered */}
              {photos.map((photo, index) => (
                <Box
                  key={photo.id || index}
                  position="absolute"
                  left={100 + index * 50}
                  top={100 + index * 30}
                  cursor="move"
                  width="200px"
                  height="150px"
                  boxShadow="md"
                  onClick={() => setActivePhoto(photo)}
                  border={activePhoto === photo ? "2px solid blue" : "none"}
                >
                  <img
                    src={photo.file_path}
                    alt="Memory"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </Box>
              ))}
            </Box>
          )}

          {viewType === "grid" && (
            <SimpleGrid columns={3} spacing={4}>
              {photos.map((photo, index) => (
                <Box
                  key={photo.id || index}
                  boxShadow="md"
                  borderRadius="md"
                  overflow="hidden"
                >
                  <img
                    src={photo.file_path}
                    alt="Memory"
                    style={{
                      width: "100%",
                      aspectRatio: "3/2",
                      objectFit: "cover",
                    }}
                  />
                </Box>
              ))}
            </SimpleGrid>
          )}

          {viewType === "places" && (
            <Box p={4}>
              <Text fontSize="lg" mb={4}>
                Places View - Coming Soon
              </Text>
              <Text>This view will organize photos by location on a map.</Text>
            </Box>
          )}

          {viewType === "timeline" && (
            <Box p={4}>
              <Text fontSize="lg" mb={4}>
                Timeline View - Coming Soon
              </Text>
              <Text>This view will organize photos chronologically.</Text>
            </Box>
          )}

          {photos.length === 0 && (
            <Flex
              direction="column"
              align="center"
              justify="center"
              height="300px"
            >
              <Text mb={4} color="gray.500">
                No photos added to this memory yet
              </Text>
              <Button leftIcon={<AttachmentIcon />} onClick={handlePhotoUpload}>
                Add Photos
              </Button>
            </Flex>
          )}
        </Box>
      </Box>
    </MasterLayout>
  );
};

export default function WrappedMemoryEditor() {
  return (
    <ErrorBoundary>
      <MemoryEditorPage />
    </ErrorBoundary>
  );
}
